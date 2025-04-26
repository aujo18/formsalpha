import React, { useState } from 'react';
import { ClipboardCheck, ChevronRight } from 'lucide-react';

interface HomePageProps {
  setCurrentForm: (form: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setCurrentForm }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="mb-8 text-center">
        <img 
          src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" 
          alt="Logo CAMBI" 
          className="h-24 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-[#102947] mb-1">Système d'inspection</h1>
        <p className="text-gray-600">Sélectionnez le type d'inspection à effectuer</p>
      </header>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-4xl mx-auto">
        <button 
          onClick={() => setCurrentForm('form1')}
          className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-[#b22a2e]"
        >
          <div className="rounded-full bg-[#b22a2e]/10 p-4 mb-4">
            <ClipboardCheck size={48} className="text-[#b22a2e]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">MDSA</h2>
          <p className="text-gray-600 text-center">Vérification du moniteur défibrillateur semi-automatique</p>
          <ChevronRight className="mt-4 text-[#b22a2e]" />
        </button>
        
        <button 
          onClick={() => setCurrentForm('form2')}
          className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-[#102947]"
        >
          <div className="rounded-full bg-[#102947]/10 p-4 mb-4">
            <ClipboardCheck size={48} className="text-[#102947]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Inspection Médicale</h2>
          <p className="text-gray-600 text-center">Vérification du materiel de l'ambulance</p>
          <ChevronRight className="mt-4 text-[#102947]" />
        </button>
        
        <button 
          onClick={() => setCurrentForm('form3')}
          className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-[#4f6683]"
        >
          <div className="rounded-full bg-[#4f6683]/10 p-4 mb-4">
            <ClipboardCheck size={48} className="text-[#4f6683]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Inspection Mécanique</h2>
          <p className="text-gray-600 text-center">Véhicules ambulanciers</p>
          <ChevronRight className="mt-4 text-[#4f6683]" />
        </button>
      </div>
      
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} CAMBI - Tous droits réservés</p>
      </footer>
    </div>
  );
};

export default HomePage; 