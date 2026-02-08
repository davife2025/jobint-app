const { ethers } = require('ethers');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const contractABI = require('../contract/JobintVerification.json');

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      process.env.BSC_CONTRACT_ADDRESS,
      contractABI.abi,
      this.wallet
    );
  }

  /**
   * Generate hash for job listing
   */
  generateJobHash(jobId, title, company) {
    return ethers.keccak256(
      ethers.toUtf8Bytes(`${jobId}-${title}-${company}`)
    );
  }

  /**
   * Generate hash for user profile
   */
  generateProfileHash(userId, skills, timestamp) {
    const profileData = `${userId}-${skills.join(',')}-${timestamp}`;
    return ethers.keccak256(ethers.toUtf8Bytes(profileData));
  }

  /**
   * Record application on blockchain
   */
  async recordApplication(userId, jobListingId) {
    try {
      // Get job and user data
      const jobResult = await query(
        'SELECT id, title, company FROM job_listings WHERE id = $1',
        [jobListingId]
      );
      
      const skillsResult = await query(
        'SELECT skill_name FROM user_skills WHERE user_id = $1',
        [userId]
      );

      if (jobResult.rows.length === 0) {
        throw new Error('Job not found');
      }

      const job = jobResult.rows[0];
      const skills = skillsResult.rows.map(row => row.skill_name);

      // Generate hashes
      const jobHash = this.generateJobHash(job.id, job.title, job.company);
      const profileHash = this.generateProfileHash(userId, skills, Date.now());

      logger.info(`Recording application on blockchain for job: ${job.title}`);

      // Submit to blockchain
      const tx = await this.contract.recordApplication(jobHash, profileHash);
      const receipt = await tx.wait();

      logger.info(`Application recorded on blockchain: ${receipt.hash}`);

      // Extract recordId from event
      const event = receipt.logs.find(log => 
        log.topics[0] === ethers.id('ApplicationRecorded(bytes32,address,bytes32,uint256)')
      );
      
      let recordId = null;
      if (event) {
        const decoded = this.contract.interface.parseLog({
          topics: event.topics,
          data: event.data
        });
        recordId = decoded.args[0];
      }

      // Store in database
      await query(
        `INSERT INTO blockchain_records 
         (user_id, record_type, tx_hash, block_number, data_hash)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, 'application', receipt.hash, receipt.blockNumber, jobHash]
      );

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        recordId: recordId
      };
    } catch (error) {
      logger.error('Blockchain record error:', error);
      throw error;
    }
  }

  /**
   * Record interview on blockchain
   */
  async recordInterview(userId, applicationId, scheduledTime, company, location) {
    try {
      // Get application hash
      const appResult = await query(
        'SELECT blockchain_tx_hash FROM applications WHERE id = $1',
        [applicationId]
      );

      if (appResult.rows.length === 0) {
        throw new Error('Application not found');
      }

      const applicationHash = appResult.rows[0].blockchain_tx_hash || ethers.ZeroHash;
      const companyHash = ethers.keccak256(ethers.toUtf8Bytes(company));
      const timestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);

      logger.info(`Recording interview on blockchain for ${company}`);

      // Submit to blockchain
      const tx = await this.contract.recordInterview(
        applicationHash,
        timestamp,
        companyHash,
        location
      );
      const receipt = await tx.wait();

      logger.info(`Interview recorded on blockchain: ${receipt.hash}`);

      // Store in database
      await query(
        `INSERT INTO blockchain_records 
         (user_id, record_type, tx_hash, block_number, data_hash, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId, 
          'interview', 
          receipt.hash, 
          receipt.blockNumber, 
          companyHash,
          JSON.stringify({ company, scheduledTime, location })
        ]
      );

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      logger.error('Interview blockchain record error:', error);
      throw error;
    }
  }

  /**
   * Batch record multiple applications (gas optimization)
   */
  async batchRecordApplications(userId, jobListingIds) {
    try {
      if (jobListingIds.length > 10) {
        throw new Error('Maximum 10 applications per batch');
      }

      // Get jobs
      const jobsResult = await query(
        'SELECT id, title, company FROM job_listings WHERE id = ANY($1)',
        [jobListingIds]
      );

      const skillsResult = await query(
        'SELECT skill_name FROM user_skills WHERE user_id = $1',
        [userId]
      );

      const skills = skillsResult.rows.map(row => row.skill_name);
      const profileHash = this.generateProfileHash(userId, skills, Date.now());

      // Generate job hashes
      const jobHashes = jobsResult.rows.map(job => 
        this.generateJobHash(job.id, job.title, job.company)
      );

      logger.info(`Batch recording ${jobHashes.length} applications`);

      // Submit to blockchain
      const tx = await this.contract.batchRecordApplications(jobHashes, profileHash);
      const receipt = await tx.wait();

      logger.info(`Batch applications recorded: ${receipt.hash}`);

      // Store records in database
      for (const hash of jobHashes) {
        await query(
          `INSERT INTO blockchain_records 
           (user_id, record_type, tx_hash, block_number, data_hash)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, 'application', receipt.hash, receipt.blockNumber, hash]
        );
      }

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        count: jobHashes.length
      };
    } catch (error) {
      logger.error('Batch blockchain record error:', error);
      throw error;
    }
  }

  /**
   * Get user's blockchain stats
   */
  async getUserStats(walletAddress) {
    try {
      const [totalApplications, totalInterviews] = await this.contract.getUserStats(walletAddress);
      
      return {
        applications: Number(totalApplications),
        interviews: Number(totalInterviews)
      };
    } catch (error) {
      logger.error('Get blockchain stats error:', error);
      return { applications: 0, interviews: 0 };
    }
  }

  /**
   * Verify application on blockchain
   */
  async verifyApplication(recordId) {
    try {
      const record = await this.contract.verifyApplication(recordId);
      
      return {
        user: record.user,
        jobHash: record.jobHash,
        profileHash: record.profileHash,
        timestamp: new Date(Number(record.timestamp) * 1000),
        status: record.status,
        exists: record.exists
      };
    } catch (error) {
      logger.error('Verify application error:', error);
      throw error;
    }
  }

  /**
   * Get current gas price estimate
   */
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPriceGwei = ethers.formatUnits(feeData.gasPrice || 0, 'gwei');
      return gasPriceGwei;
    } catch (error) {
      logger.error('Get gas price error:', error);
      return '5'; // Default estimate
    }
  }

  /**
   * Estimate cost for recording application
   */
  async estimateApplicationCost() {
    try {
      const mockJobHash = ethers.keccak256(ethers.toUtf8Bytes('mock'));
      const mockProfileHash = ethers.keccak256(ethers.toUtf8Bytes('mock'));

      const gasEstimate = await this.contract.recordApplication.estimateGas(
        mockJobHash,
        mockProfileHash
      );

      const feeData = await this.provider.getFeeData();
      const gasCost = gasEstimate * (feeData.gasPrice || 0n);
      const gasCostBNB = ethers.formatEther(gasCost);
      
      // Rough BNB to USD (should fetch real price)
      const bnbPrice = 300;
      const usdEstimate = (parseFloat(gasCostBNB) * bnbPrice).toFixed(4);

      return {
        gasCost: `${gasCostBNB} BNB`,
        usdEstimate: `$${usdEstimate}`
      };
    } catch (error) {
      logger.error('Estimate gas error:', error);
      return { gasCost: '~0.001 BNB', usdEstimate: '~$0.30' };
    }
  }
}

module.exports = new BlockchainService();