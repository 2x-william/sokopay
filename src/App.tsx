import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Transaction {
  id: string;
  type: 'payment' | 'deposit';
  amount: number;
  method: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
}

interface User {
  email: string;
  balance: number;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('sokopay_user');
    const savedProducts = localStorage.getItem('sokopay_products');
    const savedTransactions = localStorage.getItem('sokopay_transactions');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      const defaultProducts: Product[] = [
        { id: '1', name: 'Produit 1', price: 5000, stock: 10 },
        { id: '2', name: 'Produit 2', price: 8000, stock: 5 }
      ];
      setProducts(defaultProducts);
      localStorage.setItem('sokopay_products', JSON.stringify(defaultProducts));
    }
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  const handleLogin = () => {
    if (!loginEmail || !loginPassword) {
      alert('Remplis email et mot de passe!');
      return;
    }
    const newUser: User = {
      email: loginEmail,
      balance: 150000
    };
    setUser(newUser);
    setIsLoggedIn(true);
    localStorage.setItem('sokopay_user', JSON.stringify(newUser));
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('sokopay_user');
    setCurrentPage('dashboard');
  };

  const handleAddProduct = () => {
    if (!productName || !productPrice || !productStock) {
      alert('Remplis tous les champs!');
      return;
    }

    if (editingProduct) {
      const updatedProducts = products.map(p =>
        p.id === editingProduct
          ? { ...p, name: productName, price: parseInt(productPrice), stock: parseInt(productStock) }
          : p
      );
      setProducts(updatedProducts);
      localStorage.setItem('sokopay_products', JSON.stringify(updatedProducts));
      setEditingProduct(null);
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: productName,
        price: parseInt(productPrice),
        stock: parseInt(productStock)
      };
      const updatedProducts = [...products, newProduct];
      setProducts(updatedProducts);
      localStorage.setItem('sokopay_products', JSON.stringify(updatedProducts));
    }

    setProductName('');
    setProductPrice('');
    setProductStock('');
  };

  const handleDeleteProduct = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    localStorage.setItem('sokopay_products', JSON.stringify(updatedProducts));
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product.id);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductStock(product.stock.toString());
  };

  const handleDeposit = () => {
    if (!depositAmount || !selectedPaymentMethod) {
      alert('Remplis montant et méthode!');
      return;
    }

    const amount = parseInt(depositAmount);
    if (user) {
      const updatedUser = { ...user, balance: user.balance + amount };
      setUser(updatedUser);
      localStorage.setItem('sokopay_user', JSON.stringify(updatedUser));

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'deposit',
        amount,
        method: selectedPaymentMethod,
        date: new Date().toLocaleString('fr-FR'),
        status: 'completed'
      };
      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      localStorage.setItem('sokopay_transactions', JSON.stringify(updatedTransactions));

      setDepositAmount('');
      setSelectedPaymentMethod('');
      alert('Dépôt réussi! 🎉');
    }
  };

const handleExportCSV = () => {
  if (products.length === 0) {
    alert('Aucun produit à exporter!');
    return;
  }

  let csv = 'Nom,Prix,Stock\n';
  products.forEach(p => {
    csv += `"${p.name}",${p.price},${p.stock}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sokopay_produits.csv';
  a.click();
  URL.revokeObjectURL(url);
  alert('Produits exportés! 📊');
};

const handleImportCSV = (event: any) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e: any) => {
    try {
      const text = e.target.result;
      const lines = text.split('\n');
      const newProducts: Product[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const [name, priceStr, stockStr] = lines[i].split(',');
        const price = parseInt(priceStr);
        const stock = parseInt(stockStr);

        if (name && price && stock) {
          newProducts.push({
            id: Date.now().toString() + i,
            name: name.replace(/"/g, ''),
            price,
            stock
          });
        }
      }

      if (newProducts.length === 0) {
        alert('Format CSV invalide! Utilise: Nom,Prix,Stock');
        return;
      }

      const updatedProducts = [...products, ...newProducts];
      setProducts(updatedProducts);
      localStorage.setItem('sokopay_products', JSON.stringify(updatedProducts));
      alert(`${newProducts.length} produits importés! 🎉`);
    } catch (error) {
      alert('Erreur lors de l\'importation!');
    }
  };
  reader.readAsText(file);
};


  const handlePayment = (method: string) => {
    if (!user) return;
    
    const amount = parseInt(depositAmount) || 5000;
    const updatedUser = { ...user, balance: user.balance - amount };
    setUser(updatedUser);
    localStorage.setItem('sokopay_user', JSON.stringify(updatedUser));

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'payment',
      amount,
      method,
      date: new Date().toLocaleString('fr-FR'),
      status: 'completed'
    };
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    localStorage.setItem('sokopay_transactions', JSON.stringify(updatedTransactions));

    alert(`Paiement ${method} réussi! -${amount} XOF`);
  };

  const DashboardPage = () => (
    <div className="text-center space-y-8">
      <h2 className="text-3xl font-bold text-gray-800">Tableau de bord</h2>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg border-2 border-blue-200">
          <p className="text-gray-600 font-semibold">Solde</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{user?.balance.toLocaleString('fr-FR')} XOF</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-lg border-2 border-green-200">
          <p className="text-gray-600 font-semibold">Produits</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{products.length}</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-lg border-2 border-orange-200">
          <p className="text-gray-600 font-semibold">Transactions</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">{transactions.length}</p>
        </div>
      </div>

      <div className="mt-8 text-left max-w-2xl mx-auto bg-gray-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Dernières Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500">Pas encore de transactions</p>
        ) : (
          <div className="space-y-3">
            {transactions.slice(-5).reverse().map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <p className="font-semibold capitalize">{t.type === 'deposit' ? 'Dépôt' : 'Paiement'}: {t.method}</p>
                  <p className="text-sm text-gray-500">{t.date}</p>
                </div>
                <p className={`font-bold ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'deposit' ? '+' : '-'}{t.amount} XOF
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const ProductsPage = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Gestion des Produits</h2>

      <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleExportCSV}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition"
          >
            📥 Exporter CSV
          </button>
          <label className="flex-1">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition cursor-pointer">
              📤 Importer CSV
            </button>
          </label>
        </div>
        <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Modifier Produit' : 'Ajouter Produit'}</h3>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nom du produit"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Prix (XOF)"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            className="w-full p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Stock"
            value={productStock}
            onChange={(e) => setProductStock(e.target.value)}
            className="w-full p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          
          <div className="flex gap-3">
            <button
              onClick={handleAddProduct}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              {editingProduct ? '✏️ Modifier' : '➕ Ajouter'}
            </button>
            {editingProduct && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductName('');
                  setProductPrice('');
                  setProductStock('');
                }}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold hover:bg-gray-500 transition"
              >
                ❌ Annuler
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-bold">Mes Produits ({products.length})</h3>
        {products.length === 0 ? (
          <p className="text-gray-500 bg-gray-50 p-4 rounded">Pas encore de produits</p>
        ) : (
          products.map(product => (
            <div key={product.id} className="bg-white border-2 border-gray-200 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold text-lg">{product.name}</p>
                <p className="text-gray-600">{product.price.toLocaleString('fr-FR')} XOF • Stock: {product.stock}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const WalletPage = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Portefeuille</h2>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-lg text-center">
        <p className="text-lg font-semibold">Solde Actuel</p>
        <p className="text-5xl font-bold mt-2">{user?.balance.toLocaleString('fr-FR')} XOF</p>
      </div>

      <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
        <h3 className="text-xl font-bold mb-4">Ajouter des Fonds</h3>
        
        <div className="space-y-4">
          <input
            type="number"
            placeholder="Montant (XOF)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full p-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500"
          />
          
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="w-full p-3 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-500"
          >
            <option value="">Choisir méthode...</option>
            <option value="MTN Money">MTN Money</option>
            <option value="Moov Money">Moov Money</option>
            <option value="Orange Money">Orange Money</option>
            <option value="Wave">Wave</option>
          </select>

          <button
            onClick={handleDeposit}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
          >
            💰 Ajouter Fonds
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Historique</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500">Pas de transactions</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(t => (
              <div key={t.id} className="bg-white p-3 rounded border flex justify-between">
                <span className="font-semibold">{t.method}</span>
                <span className={t.type === 'deposit' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {t.type === 'deposit' ? '+' : '-'}{t.amount} XOF
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const PaymentsPage = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Paiements FedaPay</h2>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handlePayment('MTN Money')}
          className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white p-6 rounded-lg font-bold hover:shadow-lg transition text-lg"
        >
          📱 MTN Money<br/>Paiement par MTN
        </button>
        <button
          onClick={() => handlePayment('Moov Money')}
          className="bg-gradient-to-br from-orange-400 to-orange-600 text-white p-6 rounded-lg font-bold hover:shadow-lg transition text-lg"
        >
          📱 Moov Money<br/>Paiement par Moov
        </button>
        <button
          onClick={() => handlePayment('Orange Money')}
          className="bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 rounded-lg font-bold hover:shadow-lg transition text-lg"
        >
          📱 Orange Money<br/>Paiement par Orange
        </button>
        <button
          onClick={() => handlePayment('Wave')}
          className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-lg font-bold hover:shadow-lg transition text-lg"
        >
          🌊 Wave<br/>Paiement par Wave
        </button>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
        <p className="text-gray-700">
          💡 <strong>Info:</strong> Clique sur un bouton pour tester les paiements avec FedaPay!
        </p>
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏪</div>
            <h1 className="text-4xl font-bold text-gray-800">SokoPay</h1>
            <p className="text-gray-600 mt-2">Paiements simplifié pour marchands</p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition"
            >
              Connexion
            </button>
            <p className="text-center text-gray-600 text-sm">
              Demo: Utilise n'importe quel email/password
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">🏪 SokoPay</div>
          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="bg-white border-b-2 border-gray-200">
        <div className="max-w-6xl mx-auto px-6 flex gap-0">
          {['dashboard', 'products', 'wallet', 'payments'].map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-6 py-4 font-bold border-b-4 transition ${
                currentPage === page
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
            >
              {page === 'dashboard' && '📊 Tableau de bord'}
              {page === 'products' && '📦 Produits'}
              {page === 'wallet' && '💼 Portefeuille'}
              {page === 'payments' && '💳 Paiements'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'products' && <ProductsPage />}
        {currentPage === 'wallet' && <WalletPage />}
        {currentPage === 'payments' && <PaymentsPage />}
      </div>
    </div>
  );
}