// This file is the single source of truth for all smart contract ABIs.
// It is imported by `contracts.ts` to configure the application.

export interface ContractConfig {
  address: string;
  abi: any;
}

export interface AppContracts {
  trustOracle: ContractConfig;
  proofLedgerCore: ContractConfig;
  insuranceHub: ContractConfig;
}

// NOTE: These ABIs are now complete, including functions, events, and errors.
const TrustOracleABI = [
  {"inputs":[],"name":"InsufficientStake","type":"error"},
  {"inputs":[],"name":"OracleAlreadyRegistered","type":"error"},
  {"inputs":[],"name":"OracleNotRegistered","type":"error"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"assetId","type":"bytes32"},{"indexed":true,"internalType":"uint8","name":"dataType","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"medianValue","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"weightedAverage","type":"uint256"}],"name":"ConsensusUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"disputeId","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"submissionId","type":"uint256"},{"indexed":true,"internalType":"address","name":"challenger","type":"address"}],"name":"DisputeCreated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"disputeId","type":"uint256"},{"indexed":false,"internalType":"bool","name":"challengerWon","type":"bool"}],"name":"DisputeResolved","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oracle","type":"address"},{"indexed":false,"internalType":"uint256","name":"stake","type":"uint256"}],"name":"OracleRegistered","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oracle","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"string","name":"reason","type":"string"}],"name":"OracleSlashed","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"assetId","type":"bytes32"},{"indexed":true,"internalType":"uint8","name":"dataType","type":"uint8"},{"indexed":true,"internalType":"address","name":"oracle","type":"address"},{"indexed":false,"internalType":"uint256","name":"submissionId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"confidence","type":"uint256"}],"name":"OracleSubmissionAdded","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oracle","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RewardDistributed","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"submissionId","type":"uint256"},{"internalType":"bytes32","name":"assetId","type":"bytes32"},{"internalType":"uint8","name":"dataType","type":"uint8"},{"internalType":"bytes32","name":"reason","type":"bytes32"}],"name":"createDispute","outputs":[{"internalType":"uint256","name":"disputeId","type":"uint256"}],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"assetId","type":"bytes32"},{"internalType":"uint8","name":"dataType","type":"uint8"}],"name":"getConsensus","outputs":[{"internalType":"uint256","name":"medianValue","type":"uint256"},{"internalType":"uint256","name":"weightedAverage","type":"uint256"},{"internalType":"uint256","name":"submissionCount","type":"uint256"},{"internalType":"uint256","name":"lastUpdated","type":"uint256"},{"internalType":"bool","name":"consensusReached","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"oracle","type":"address"}],"name":"getOracleProfile","outputs":[{"components":[{"internalType":"enum TrustOracle.OracleStatus","name":"status","type":"uint8"},{"internalType":"uint256","name":"reputation","type":"uint256"},{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"uint256","name":"totalSubmissions","type":"uint256"},{"internalType":"uint256","name":"verifiedSubmissions","type":"uint256"},{"internalType":"uint256","name":"disputedSubmissions","type":"uint256"},{"internalType":"uint256","name":"slashCount","type":"uint256"},{"internalType":"uint256","name":"lastSubmissionTime","type":"uint256"},{"internalType":"uint256","name":"registrationTime","type":"uint256"},{"internalType":"string","name":"metadataURI","type":"string"}],"internalType":"struct TrustOracle.OracleProfile","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"string","name":"metadataURI","type":"string"}],"name":"registerOracle","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"disputeId","type":"uint256"},{"internalType":"bool","name":"challengerWon","type":"bool"}],"name":"resolveDispute","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint8","name":"dataType","type":"uint8"},{"internalType":"bytes32","name":"assetId","type":"bytes32"},{"internalType":"uint256","name":"numericValue","type":"uint256"},{"internalType":"string","name":"stringValue","type":"string"},{"internalType":"bytes32","name":"proofHash","type":"bytes32"},{"internalType":"uint256","name":"confidence","type":"uint256"}],"name":"submitAssetData","outputs":[{"internalType":"uint256","name":"submissionId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}
];

const ProofLedgerCoreABI = [
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"from","type":"address"},{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"bytes32","name":"transferId","type":"bytes32"}],"name":"AssetTransferred","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"previousCustodian","type":"address"},{"indexed":true,"internalType":"address","name":"newCustodian","type":"address"}],"name":"CustodianChanged","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"bytes32","name":"assetId","type":"bytes32"},{"indexed":false,"internalType":"uint8","name":"assetType","type":"uint8"}],"name":"DigitalTwinMinted","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"ReVerificationRequired","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint8","name":"newStatus","type":"uint8"},{"indexed":false,"internalType":"address","name":"updatedBy","type":"address"}],"name":"StatusUpdated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"bytes32","name":"snapshotId","type":"bytes32"}],"name":"VerificationSnapshotAdded","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes32","name":"dataHash","type":"bytes32"},{"internalType":"string","name":"location","type":"string"},{"internalType":"uint8","name":"currentStatus","type":"uint8"},{"internalType":"bytes32[]","name":"sensorDataHashes","type":"bytes32[]"},{"internalType":"bool","name":"isFinal","type":"bool"}],"name":"addVerificationSnapshot","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"custodian","type":"address"}],"name":"authorizeCustodian","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getCurrentCustodian","outputs":[{"internalType":"address","name":"custodian","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"lender","type":"address"}],"name":"markAsCollateral","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"assetId","type":"bytes32"},{"internalType":"uint8","name":"assetType","type":"uint8"},{"internalType":"uint256","name":"verifiedValue","type":"uint256"},{"internalType":"bytes32","name":"verificationHash","type":"bytes32"},{"internalType":"address","name":"legalOwner","type":"address"},{"internalType":"string","name":"metadataURI","type":"string"},{"internalType":"uint256","name":"reVerificationPeriod","type":"uint256"}],"name":"mintDigitalTwin","outputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"newCustodian","type":"address"}],"name":"transferCustody","outputs":[],"stateMutability":"nonpayable","type":"function"}
];

const InsuranceHubABI = [
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"claimId","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"policyId","type":"uint256"},{"indexed":true,"internalType":"address","name":"claimant","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"ClaimFiled","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"claimId","type":"uint256"},{"indexed":false,"internalType":"uint8","name":"status","type":"uint8"},{"indexed":false,"internalType":"address","name":"assessedBy","type":"address"}],"name":"ClaimAssessed","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"claimId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"payoutAmount","type":"uint256"}],"name":"ClaimPaid","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"policyId","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"policyHolder","type":"address"},{"indexed":false,"internalType":"uint256","name":"premium","type":"uint256"}],"name":"PolicyCreated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"assetId","type":"bytes32"},{"indexed":false,"internalType":"uint8","name":"riskLevel","type":"uint8"},{"indexed":false,"internalType":"uint256","name":"premiumRate","type":"uint256"}],"name":"RiskAssessed","type":"event"},
  {"inputs":[{"internalType":"uint256","name":"claimId","type":"uint256"},{"internalType":"bool","name":"approve","type":"bool"},{"internalType":"uint256","name":"payoutAmount","type":"uint256"},{"internalType":"bytes32","name":"assessmentHash","type":"bytes32"}],"name":"assessClaim","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"policyId","type":"uint256"},{"internalType":"string","name":"reason","type":"string"}],"name":"cancelPolicy","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"insuredValue","type":"uint256"},{"internalType":"uint256","name":"premium","type":"uint256"},{"internalType":"uint256","name":"duration","type":"uint256"},{"internalType":"bytes32[]","name":"coveredRisks","type":"bytes32[]"},{"internalType":"uint256","name":"deductible","type":"uint256"},{"internalType":"string","name":"metadataURI","type":"string"}],"name":"createPolicy","outputs":[{"internalType":"uint256","name":"policyId","type":"uint256"}],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"policyId","type":"uint256"},{"internalType":"uint256","name":"claimAmount","type":"uint256"},{"internalType":"bytes32","name":"incidentProof","type":"bytes32"},{"internalType":"string","name":"incidentDescription","type":"string"}],"name":"fileClaim","outputs":[{"internalType":"uint256","name":"claimId","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"claimId","type":"uint256"}],"name":"processClaim","outputs":[],"stateMutability":"payable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"policyId","type":"uint256"},{"internalType":"uint256","name":"newDuration","type":"uint256"}],"name":"renewPolicy","outputs":[],"stateMutability":"payable","type":"function"}
];


export const contracts: AppContracts = {
  trustOracle: {
    address: '', // Address will be set in the network-specific config
    abi: TrustOracleABI,
  },
  proofLedgerCore: {
    address: '',
    abi: ProofLedgerCoreABI,
  },
  insuranceHub: {
    address: '',
    abi: InsuranceHubABI,
  },
};

    