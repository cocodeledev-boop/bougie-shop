import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Header from './components/Header'
import PanierTiroir from './components/PanierTiroir'
import BarreConfiance from './components/BarreConfiance'
import Footer from './components/Footer'
import PopupBienvenue from './components/PopupBienvenue'
import Pixels from './components/Pixels'
import Accueil from './pages/Accueil'
import Boutique from './pages/Boutique'
import DetailProduit from './pages/DetailProduit'
import Favoris from './pages/Favoris'
import APropos from './pages/APropos'
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
          <Pixels />
          <Header onOuvrirPanier={() => setPanierOuvert(true)} />
          <BarreConfiance />
          <PanierTiroir ouvert={panierOuvert} onFermer={() => setPanierOuvert(false)} />
          <PopupBienvenue />
          <main>
            <Routes>
              <Route path="/" element={<Accueil />} />
              <Route path="/boutique" element={<Boutique />} />
              <Route path="/boutique/:id" element={<DetailProduit />} />
              <Route path="/favoris" element={<Favoris />} />
              <Route path="/a-propos" element={<APropos />} />
              <Route path="/connexion" element={<Connexion />} />
              <Route path="/inscription" element={<Inscription />} />
              <Route path="/compte" element={<Compte />} />
              <Route path="/commande" element={<Commande />} />
              <Route path="/commande-succes" element={<CommandeSucces />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
