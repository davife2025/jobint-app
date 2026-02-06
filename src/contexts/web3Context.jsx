// src/context/Web3Context.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const Web3Context = createContext();

// Import contract ABI (you'll need to add this after deployment)
import JobIntABI from '../contracts/JobIntVerification.json';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const BSC_NETWORK = process.env.REACT_APP_BSC_NETWORK === 'mainnet' 
  ? { chainId: '0x38', name: 'BSC Mainnet' }
  : { chainId: '0x61', name: 'BSC Testnet' };

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        console.log('MetaMask not installed');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask to use blockchain features');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      setIsConnecting(true);

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      // Check if on correct network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== BSC_NETWORK.chainId) {
        await switchNetwork();
      }

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();

      // Initialize contract
      const jobIntContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        JobIntABI.abi,
        signer
      );

      setAccount(accounts[0]);
      setProvider(web3Provider);
      setContract(jobIntContract);
      setNetworkError(false);

      toast.success('Wallet connected successfully!');

    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_NETWORK.chainId }],
      });
    } catch (switchError) {
      // Network not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BSC_NETWORK.chainId,
                chainName: BSC_NETWORK.name,
                rpcUrls: [
                  BSC_NETWORK.chainId === '0x38' 
                    ? 'https://bsc-dataseed.binance.org/' 
                    : 'https://data-seed-prebsc-1-s1.binance.org:8545/'
                ],
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18
                },
                blockExplorerUrls: [
                  BSC_NETWORK.chainId === '0x38'
                    ? 'https://bscscan.com'
                    : 'https://testnet.bscscan.com'
                ]
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          toast.error('Failed to add BSC network to MetaMask');
        }
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    toast.success('Wallet disconnected');
  };

  // Contract interaction methods

  const submitApplicationToBlockchain = async (applicationData) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const { applicationId, jobId, company, jobTitle } = applicationData;
      
      // Create data hash
      const dataHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify({
          applicationId,
          jobId,
          timestamp: Date.now()
        }))
      );

      // Submit transaction
      const tx = await contract.submitApplication(
        applicationId,
        jobId,
        company,
        jobTitle,
        dataHash
      );

      toast.loading('Submitting to blockchain...', { id: 'blockchain-tx' });

      const receipt = await tx.wait();

      toast.success('Verified on blockchain!', { id: 'blockchain-tx' });

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Blockchain submission error:', error);
      toast.error('Blockchain verification failed', { id: 'blockchain-tx' });
      throw error;
    }
  };

  const scheduleInterviewOnBlockchain = async (interviewData) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const { interviewId, applicationId, company, scheduledTime } = interviewData;
      
      const dataHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify({
          interviewId,
          applicationId,
          scheduledTime: scheduledTime.getTime()
        }))
      );

      const timestamp = Math.floor(scheduledTime.getTime() / 1000);

      const tx = await contract.scheduleInterview(
        interviewId,
        applicationId,
        company,
        timestamp,
        dataHash
      );

      toast.loading('Recording interview on blockchain...', { id: 'blockchain-tx' });

      const receipt = await tx.wait();

      toast.success('Interview verified on blockchain!', { id: 'blockchain-tx' });

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Interview blockchain error:', error);
      toast.error('Failed to verify interview on blockchain', { id: 'blockchain-tx' });
      throw error;
    }
  };

  const getUserApplicationsFromBlockchain = async () => {
    if (!contract || !account) {
      return [];
    }

    try {
      const applicationIds = await contract.getUserApplications(account);
      
      const applications = await Promise.all(
        applicationIds.map(async (id) => {
          const app = await contract.getApplication(id);
          return {
            applicationId: id,
            jobId: app.jobId,
            company: app.company,
            jobTitle: app.jobTitle,
            timestamp: new Date(Number(app.timestamp) * 1000)
          };
        })
      );

      return applications;

    } catch (error) {
      console.error('Error fetching blockchain applications:', error);
      return [];
    }
  };

  const getUserStatsFromBlockchain = async () => {
    if (!contract || !account) {
      return { applications: 0, interviews: 0 };
    }

    try {
      const [appCount, interviewCount] = await Promise.all([
        contract.getUserApplicationCount(account),
        contract.getUserInterviewCount(account)
      ]);

      return {
        applications: Number(appCount),
        interviews: Number(interviewCount)
      };

    } catch (error) {
      console.error('Error fetching blockchain stats:', error);
      return { applications: 0, interviews: 0 };
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          toast.info('Account changed');
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const value = {
    account,
    provider,
    contract,
    isConnecting,
    networkError,
    connectWallet,
    disconnectWallet,
    submitApplicationToBlockchain,
    scheduleInterviewOnBlockchain,
    getUserApplicationsFromBlockchain,
    getUserStatsFromBlockchain
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export default Web3Context;