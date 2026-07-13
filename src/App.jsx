import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Header from './components/Header'
import PanierTiroir from './components/PanierTiroir'
import Accueil from './pages/Accueil'
import Boutique from './pages/Boutique'
import Connexion from './pages/Connexion'
import Inscription from './pages/Inscription'
import Compte from './pages/Compte'
import Commande from './pages/Commande'
import CommandeSucces from './pages/CommandeSucces'
import Admin from './pages/Admin'

export default function App() {
  const [panierOuvert, setPanierOuvert] = useState(false)

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Header onOuvrirPanier={() => setPanierOuvert(true)} />
          <PanierTiroir ouvert={panierOuvert} onFermer={() => setPanierOuvert(false)} />
          <main>
            <Routes>
              <Route path="/" element={<Accueil />} />
              <Route path="/boutique" element={<Boutique />} />
              <Route path="/connexion" element={<Connexion />} />
              <Route path="/inscription" element={<Inscription />} />
              <Route path="/compte" element={<Compte />} />
              <Route path="/commande" element={<Commande />} />
              <Route path="/commande-succes" element={<CommandeSucces />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
