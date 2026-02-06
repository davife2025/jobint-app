// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title JobIntVerification
 * @dev Store immutable proof of job applications and interview bookings on BSC
 */
contract JobIntVerification {
    
    struct Application {
        address userWallet;
        string jobId;
        string company;
        string jobTitle;
        uint256 timestamp;
        bytes32 dataHash; // Hash of full application details
        bool exists;
    }
    
    struct Interview {
        address userWallet;
        string interviewId;
        string applicationId;
        string company;
        uint256 scheduledTime;
        bytes32 dataHash;
        bool exists;
        bool cancelled;
    }
    
    // Mappings
    mapping(string => Application) public applications; // applicationId => Application
    mapping(string => Interview) public interviews; // interviewId => Interview
    mapping(address => string[]) public userApplications; // user => applicationIds[]
    mapping(address => string[]) public userInterviews; // user => interviewIds[]
    
    // Events
    event ApplicationSubmitted(
        string indexed applicationId,
        address indexed userWallet,
        string company,
        string jobTitle,
        uint256 timestamp
    );
    
    event InterviewScheduled(
        string indexed interviewId,
        address indexed userWallet,
        string company,
        uint256 scheduledTime
    );
    
    event InterviewCancelled(
        string indexed interviewId,
        address indexed userWallet,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyApplicationOwner(string memory applicationId) {
        require(
            applications[applicationId].userWallet == msg.sender,
            "Not application owner"
        );
        _;
    }
    
    modifier onlyInterviewOwner(string memory interviewId) {
        require(
            interviews[interviewId].userWallet == msg.sender,
            "Not interview owner"
        );
        _;
    }
    
    /**
     * @dev Record a job application on-chain
     * @param applicationId Unique application identifier
     * @param jobId External job posting ID
     * @param company Company name
     * @param jobTitle Job title
     * @param dataHash Hash of complete application data (for verification)
     */
    function submitApplication(
        string memory applicationId,
        string memory jobId,
        string memory company,
        string memory jobTitle,
        bytes32 dataHash
    ) external {
        require(!applications[applicationId].exists, "Application already exists");
        require(bytes(applicationId).length > 0, "Invalid application ID");
        require(bytes(company).length > 0, "Company required");
        
        Application memory newApp = Application({
            userWallet: msg.sender,
            jobId: jobId,
            company: company,
            jobTitle: jobTitle,
            timestamp: block.timestamp,
            dataHash: dataHash,
            exists: true
        });
        
        applications[applicationId] = newApp;
        userApplications[msg.sender].push(applicationId);
        
        emit ApplicationSubmitted(
            applicationId,
            msg.sender,
            company,
            jobTitle,
            block.timestamp
        );
    }
    
    /**
     * @dev Record an interview booking on-chain
     * @param interviewId Unique interview identifier
     * @param applicationId Related application ID
     * @param company Company name
     * @param scheduledTime Unix timestamp of interview
     * @param dataHash Hash of interview details
     */
    function scheduleInterview(
        string memory interviewId,
        string memory applicationId,
        string memory company,
        uint256 scheduledTime,
        bytes32 dataHash
    ) external {
        require(!interviews[interviewId].exists, "Interview already exists");
        require(applications[applicationId].exists, "Application not found");
        require(
            applications[applicationId].userWallet == msg.sender,
            "Not your application"
        );
        require(scheduledTime > block.timestamp, "Invalid scheduled time");
        
        Interview memory newInterview = Interview({
            userWallet: msg.sender,
            interviewId: interviewId,
            applicationId: applicationId,
            company: company,
            scheduledTime: scheduledTime,
            dataHash: dataHash,
            exists: true,
            cancelled: false
        });
        
        interviews[interviewId] = newInterview;
        userInterviews[msg.sender].push(interviewId);
        
        emit InterviewScheduled(
            interviewId,
            msg.sender,
            company,
            scheduledTime
        );
    }
    
    /**
     * @dev Cancel an interview
     * @param interviewId Interview to cancel
     */
    function cancelInterview(string memory interviewId) 
        external 
        onlyInterviewOwner(interviewId) 
    {
        require(interviews[interviewId].exists, "Interview not found");
        require(!interviews[interviewId].cancelled, "Already cancelled");
        
        interviews[interviewId].cancelled = true;
        
        emit InterviewCancelled(
            interviewId,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Get all applications for a user
     * @param user User wallet address
     * @return Array of application IDs
     */
    function getUserApplications(address user) 
        external 
        view 
        returns (string[] memory) 
    {
        return userApplications[user];
    }
    
    /**
     * @dev Get all interviews for a user
     * @param user User wallet address
     * @return Array of interview IDs
     */
    function getUserInterviews(address user) 
        external 
        view 
        returns (string[] memory) 
    {
        return userInterviews[user];
    }
    
    /**
     * @dev Get application details
     * @param applicationId Application ID
     * @return Application struct
     */
    function getApplication(string memory applicationId) 
        external 
        view 
        returns (
            address userWallet,
            string memory jobId,
            string memory company,
            string memory jobTitle,
            uint256 timestamp,
            bytes32 dataHash
        ) 
    {
        Application memory app = applications[applicationId];
        require(app.exists, "Application not found");
        
        return (
            app.userWallet,
            app.jobId,
            app.company,
            app.jobTitle,
            app.timestamp,
            app.dataHash
        );
    }
    
    /**
     * @dev Get interview details
     * @param interviewId Interview ID
     * @return Interview struct
     */
    function getInterview(string memory interviewId) 
        external 
        view 
        returns (
            address userWallet,
            string memory applicationId,
            string memory company,
            uint256 scheduledTime,
            bytes32 dataHash,
            bool cancelled
        ) 
    {
        Interview memory interview = interviews[interviewId];
        require(interview.exists, "Interview not found");
        
        return (
            interview.userWallet,
            interview.applicationId,
            interview.company,
            interview.scheduledTime,
            interview.dataHash,
            interview.cancelled
        );
    }
    
    /**
     * @dev Verify application data integrity
     * @param applicationId Application ID
     * @param dataToVerify Hash of data to verify
     * @return bool True if data matches stored hash
     */
    function verifyApplicationData(
        string memory applicationId,
        bytes32 dataToVerify
    ) external view returns (bool) {
        require(applications[applicationId].exists, "Application not found");
        return applications[applicationId].dataHash == dataToVerify;
    }
    
    /**
     * @dev Get total applications count for user
     * @param user User wallet address
     * @return uint256 Total applications
     */
    function getUserApplicationCount(address user) 
        external 
        view 
        returns (uint256) 
    {
        return userApplications[user].length;
    }
    
    /**
     * @dev Get total interviews count for user
     * @param user User wallet address
     * @return uint256 Total interviews
     */
    function getUserInterviewCount(address user) 
        external 
        view 
        returns (uint256) 
    {
        return userInterviews[user].length;
    }
}
