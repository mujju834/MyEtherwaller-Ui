import React, { useState, useEffect } from 'react';
import { Wallet, JsonRpcProvider, formatEther, parseEther } from 'ethers';
import { FiRefreshCw } from 'react-icons/fi';  // Importing a refresh icon

const MainClient: React.FC = () => {
  const [privateKey, setPrivateKey] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [loadingImport, setLoadingImport] = useState<boolean>(false);
  const [loadingTransaction, setLoadingTransaction] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [transactionError, setTransactionError] = useState<string>(''); // Separate state for transaction errors
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false); // State to manage logout modal
  const [wallets, setWallets] = useState<any[]>([]); // State to hold all user's wallets
  const [selectedWallet, setSelectedWallet] = useState<string>(''); // State to hold selected wallet address
  const [importMode, setImportMode] = useState<boolean>(false); // State to switch to import mode
  const [showTransactionForm, setShowTransactionForm] = useState<boolean>(false); // State to toggle transaction form

  const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_INFURA_URL);

  useEffect(() => {
    // Fetch wallets from backend when the component loads
    const fetchWallets = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallets`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setWallets(data.wallets);
          if (data.wallets.length > 0) {
            selectWallet(data.wallets[0].address);
          } else {
            setImportMode(true); // If no wallets, switch to import mode
          }
        } else {
          console.error('Failed to fetch wallets:', data.message);
        }
      } catch (error) {
        console.error('Error fetching wallets:', error);
      }
    };

    fetchWallets();
  }, []);

  const selectWallet = async (address: string) => {
    if (address === 'import_new') {
      setImportMode(true);
      setWalletAddress('');
      setBalance('');
      setPrivateKey('');
      setShowTransactionForm(false); // Reset transaction form visibility
      return;
    }

    try {
      setImportMode(false);
      setSelectedWallet(address);
      const wallet = wallets.find((w) => w.address === address);
      if (wallet) {
        setPrivateKey(wallet.privateKey); // Set private key if available
        const balanceInWei = await provider.getBalance(address);
        const balanceInEther = formatEther(balanceInWei);
        setWalletAddress(address);
        setBalance(balanceInEther);
        setError('');
        setShowTransactionForm(false); // Hide transaction form by default
      }
    } catch (error) {
      console.error('Error selecting wallet:', error);
      setError('Failed to load wallet details.');
    }
  };

  const importWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingImport(true);

    setTimeout(async () => {
      try {
        if (!privateKey || privateKey.length !== 64) {
          throw new Error('Invalid Private-Key');
        }

        const wallet = new Wallet(privateKey, provider);
        const balanceInWei = await provider.getBalance(wallet.address);
        const balanceInEther = formatEther(balanceInWei);

        setWalletAddress(wallet.address);
        setBalance(balanceInEther);
        setError('');

        // Save wallet to the backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ address: wallet.address, privateKey }),
        });

        const data = await response.json();
        if (response.ok) {
          setWallets((prevWallets) => [...prevWallets, { address: wallet.address, privateKey }]);
          setSelectedWallet(wallet.address);
          setImportMode(false); // Exit import mode after successful import
        } else {
          setError(data.message);
        }
      } catch (err: any) {
        setError(err.message);
        setWalletAddress('');
        setBalance('');
      } finally {
        setLoadingImport(false);
      }
    }, 3000);
  };

  const sendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTransaction(true);
    setTransactionDetails(null);
    setTransactionError('');  // Reset any previous transaction error

    try {
        if (!recipient || !amount) {
            throw new Error('Recipient address and amount are required');
        }

        const wallet = new Wallet(privateKey, provider);
        const amountInWei = parseEther(amount);

        const tx = await wallet.sendTransaction({
            to: recipient,
            value: amountInWei,
        });

        console.log('Transaction sent:', tx);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        if (!receipt) {
            throw new Error('Transaction receipt not found');
        }

        console.log('Transaction mined, receipt:', receipt);

        // Update balance after the transaction is confirmed
        const balanceInWei = await provider.getBalance(wallet.address);
        const balanceInEther = formatEther(balanceInWei);
        setBalance(balanceInEther);

        setTransactionDetails({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: formatEther(tx.value),
            gasUsed: receipt.gasUsed?.toString(),
            blockNumber: receipt.blockNumber,
            confirmations: receipt.confirmations,
            status: receipt.status === 1 ? 'Success' : 'Failed',
        });
        setTransactionError('');
        setShowTransactionForm(false); // Hide transaction form after sending
    } catch (err: any) {
        console.error('Error sending transaction:', err);
        setTransactionError(err.message || 'An unexpected error occurred');  // Set the transaction error message
        setTransactionDetails(null);
    } finally {
        setLoadingTransaction(false);
    }
};


  const handleLogout = () => {
    setPrivateKey('');
    setWalletAddress('');
    setBalance('');
    setRecipient('');
    setAmount('');
    setTransactionDetails(null);
    setError('');
    setTransactionError('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const proceedLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setTransactionDetails(null);
    setTransactionError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-full sm:max-w-lg w-full relative min-h-[200px]">
        <div className="flex items-center justify-between mb-4">
          <FiRefreshCw
            onClick={resetForm}
            className="cursor-pointer text-gray-500 hover:text-gray-700"
            size={20}
            title="Refresh"
          />
          <h2 className="text-lg sm:text-2xl font-bold text-center flex-1 text-gray-800">Ethereum Wallet</h2>
          <button 
            onClick={confirmLogout} 
            className="text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Select Wallet:</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-lg mb-4"
            value={importMode ? 'import_new' : selectedWallet}
            onChange={(e) => selectWallet(e.target.value)}
          >
            {wallets.map((wallet) => (
              <option key={wallet.address} value={wallet.address}>
                {wallet.address}
              </option>
            ))}
            <option value="import_new">Import New Wallet</option>
          </select>
        </div>

        {walletAddress && !importMode && (
          <>
            <div className="text-center mb-4">
              <p className="mb-2 break-words text-sm sm:text-base md:text-lg"><strong>Wallet Address:</strong> {walletAddress}</p>
              <p className="mb-4 break-words"><strong>Ether Balance:</strong> {balance} ETH</p>
            </div>

            {!showTransactionForm ? (
              <div className="text-center">
                <button
                  onClick={() => setShowTransactionForm(true)}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                >
                  Send Crypto
                </button>
              </div>
            ) : (
              <form onSubmit={sendTransaction} className="w-full mb-6">
                <input 
                  type="text" 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Recipient Address" 
                  className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                />
                <input 
                  type="text" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount in ETH" 
                  className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                />

                {loadingTransaction ? (
                  <div className="w-full flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <button 
                    type="submit" 
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                  >
                    Send Transaction
                  </button>
                )}

                {transactionError && (
                  <p className="text-red-500 mt-4">{transactionError}</p>
                )}
              </form>
            )}

            {loadingTransaction && (
              <div className="text-center mb-4">
                <p>Sending transaction, please wait...</p>
              </div>
            )}

            {transactionDetails && (
              <div className="text-center text-sm sm:text-base">
                <p className="mb-2 break-words"><strong>Transaction Hash:</strong> {transactionDetails.hash}</p>
                <p className="mb-2 break-words"><strong>From:</strong> {transactionDetails.from}</p>
                <p className="mb-2 break-words"><strong>To:</strong> {transactionDetails.to}</p>
                <p className="mb-2 break-words"><strong>Value:</strong> {transactionDetails.value} ETH</p>
                <p className="mb-2 break-words"><strong>Gas Used:</strong> {transactionDetails.gasUsed}</p>
                <p className="mb-2 break-words"><strong>Block Number:</strong> {transactionDetails.blockNumber}</p>
                <p className="mb-2 break-words"><strong>Confirmations:</strong> {transactionDetails.confirmations}</p>
                <p className="mb-2 break-words"><strong>Status:</strong> {transactionDetails.status}</p>
              </div>
            )}
          </>
        )}

        {importMode && (
          <>
            <form onSubmit={importWallet} className="w-full mb-6">
              <input 
                type="text" 
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter your private key" 
                className="w-full p-2 border border-gray-300 rounded-lg mb-4"
              />

              {loadingImport ? (
                <div className="w-full flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <button 
                  type="submit" 
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
                >
                  Import Wallet
                </button>
              )}
            </form>
          </>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 shadow-lg max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4 text-center">Confirm Logout</h3>
              <p className="text-center mb-4">Are you sure you want to logout?</p>
              <div className="flex justify-between">
                <button
                  onClick={cancelLogout}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={proceedLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainClient;
