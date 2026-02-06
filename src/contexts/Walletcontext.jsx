import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const WalletContext = createContext(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const BSC_CHAIN_ID = '0x38'; // BSC Mainnet
  const BSC_TESTNET_CHAIN_ID = '0x61'; // BSC Testnet

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Check if already connected
      checkConnection();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          
          setProvider(provider);
          setSigner(signer);
          setAccount(accounts[0]);
          setChainId(`0x${network.chainId.toString(16)}`);
        }
      } catch (error) {
        console.error('Connection check failed:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const currentChainId = `0x${network.chainId.toString(16)}`;

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(currentChainId);

      // Check if on BSC network
      if (currentChainId !== BSC_CHAIN_ID && currentChainId !== BSC_TESTNET_CHAIN_ID) {
        toast.error('Please switch to Binance Smart Chain network');
        await switchToBSC();
      } else {
        toast.success('Wallet connected successfully');
      }

      return accounts[0];
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Failed to connect wallet');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToBSC = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID }],
      });
    } catch (switchError) {
      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BSC_CHAIN_ID,
                chainName: 'Binance Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add BSC network:', addError);
          toast.error('Failed to add BSC network');
        }
      } else {
        console.error('Failed to switch network:', switchError);
        toast.error('Failed to switch network');
      }
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    toast.success('Wallet disconnected');
  };

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    isConnected: !!account,
    connectWallet,
    disconnect,
    switchToBSC,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};