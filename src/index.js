
import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import myContractManifest from "./contracts/MyContract.json";
import { useState, useEffect, useRef } from 'react';

function App(){
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [transactionResult, setTransactionResult] = useState(null);
  const [contractBalances, setContractBalances] = useState({ realBalance: 0, variableBalance: 0 });
  const [userBalance, setUserBalance] = useState(ethers.BigNumber.from(0));
  const bookTiket = async (i) => {
    try {
      const tx = await myContract.current.bookTiket(i, {
        gasLimit: 6721975,
        gasPrice: 20000000000,
      });
      await tx.wait();
      setTransactionResult({ success: true, message: `Ticket ${i} reserved successfully.` });
    } catch (error) {
      console.error(error);
      setTransactionResult({ success: false, message: `Error reserving Ticket ${i}. See console for details.` });
    }
  };
  const checkUserBalance = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const userAddress = await signer.getAddress();
    const balance = await provider.getBalance(userAddress);
    setUserBalance(ethers.BigNumber.from(balance));
    } catch (error) {
      console.error("Error fetching user balance", error);
    }
  };
 
  const getContractBalances = async () => {
    try {
      const balances = await myContract.current.getContractBalance();
      setContractBalances({ realBalance: balances[0], variableBalance: balances[1] });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdminChange = async (e) => {
    e.preventDefault();
    try {
      const tx = await myContract.current.changeAdmin(newAdminAddress, {
        gasLimit: 6721975,
        gasPrice: 20000000000,
      });
      await tx.wait();
      setTransactionResult({ success: true, message: "Admin changed successfully." });
    } catch (error) {
      console.error(error);
      setTransactionResult({ success: false, message: "Error changing admin. See console for details." });
    }
  };
  const myContract = useRef(null);
  const [tikets, setTikets] = useState([]);
  useEffect( () => {
    initContracts();
    const fetchUserBalance = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        const balance = await provider.getBalance(userAddress);
        setUserBalance(ethers.BigNumber.from(balance));
      } catch (error) {
        console.error("Error fetching user balance", error);
      }
    };
  
    fetchUserBalance();
  }, [])

  let initContracts = async () => {
    await configureBlockchain();
    let tiketsFromBlockchain  = await myContract.current?.getTikets();
    if (tiketsFromBlockchain != null)
      setTikets(tiketsFromBlockchain)
}


  let configureBlockchain = async () => {
    try {
      let provider = await detectEthereumProvider();
      if (provider) {
        await provider.request({ method: 'eth_requestAccounts' });
        const networkId = await provider.request({ method: 'net_version' })

        provider = new ethers.providers.Web3Provider(provider);
        const signer = provider.getSigner();
        
          myContract.current  = new Contract(
          myContractManifest.networks[networkId].address,
          myContractManifest.abi,
          signer
        );


      }
    } catch (error) { }
  }
  
  const clickBuyTiket = async (i) => {
   
    
    // Verificar que el usuario tiene suficiente saldo antes de realizar la compra
    if (userBalance.lt(ethers.utils.parseEther("0.02"))) {
      alert("Saldo insuficiente para comprar el ticket tonny");
      return;
    }
    const tx = await myContract.current.buyTiket(i, {
      value: ethers.utils.parseEther("0.02"),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    });
    await tx.wait();

    const tiketsUpdated = await myContract.current.getTikets();
    setTikets(tiketsUpdated);
     // Actualizar el balance del usuario después de la compra si es necesario
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  const balance = await provider.getBalance(userAddress);
  setUserBalance(ethers.BigNumber.from(balance));// Actualizar el balance del usuario después de la compra
  };


let withdrawBalance = async () => {
  const tx = await myContract.current.transferbalanceToAdmin(); 
}
function formatEther(weiAmount) {
    const etherAmount = weiAmount / 1e18; // 1 Ether = 1e18 Wei
    return etherAmount.toFixed(2);
  }



 
  return (
    <div>
        <h1>Tikets store</h1>
        <button onClick={() => withdrawBalance()}>Withdraw Balance</button>
        <ul>
            { tikets.map( (address, i) =>
                <li>Tiket { i } comprado por { address }
                      <>
                <a href="#" onClick={() => bookTiket(i)}>Reservar</a>
                {" | "}
              </>
                    { address == ethers.constants.AddressZero && 
                    
                        <a href="#" onClick={()=>clickBuyTiket(i)}> buy</a> }
                  
                </li>
            )}
        </ul>
        
        <form className="form-inline" onSubmit={handleAdminChange}>
        <input
          type="text"
          value={newAdminAddress}
          onChange={(e) => setNewAdminAddress(e.target.value)}
        />
        <button type="submit">Change Admin</button>
      </form>
      
      {transactionResult && (
        <div className={`alert ${transactionResult.success ? "alert-success" : "alert-danger"}`}>
          {transactionResult.message}
        </div>
)}
 <button onClick={getContractBalances}>Get Contract Balances</button>
 <div>
        <p>Real Balance: {formatEther(contractBalances.realBalance)} BNB</p>
        <p>Variable Balance: {formatEther(contractBalances.variableBalance)} BNB</p>
      </div>
<button onClick={checkUserBalance}>Check User Balance</button>
      <div>
        <p>User Balance: {ethers.utils.formatEther(userBalance)} BNB</p>
      </div>
    </div>
    

)
}




const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

