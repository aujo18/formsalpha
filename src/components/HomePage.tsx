import React from 'react';
import { ClipboardCheck, ChevronRight } from 'lucide-react';

interface HomePageProps {
  onFormSelect: (formId: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onFormSelect }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <header className="bg-[#b22a2e] text-white p-4 rounded-lg shadow-md flex items-center justify-between mb-8">
        <div className="flex items-center">
          <img src="https://res.cloudinary.com/dxyvj8rka/image/upload/f_auto,q_auto/v1/cambi/iazjhbzvu6dv5fad398u" alt="Logo CAMBI" className="h-8 mr-2 filter brightness-0 invert" />
          <h1 className="text-xl font-bold">Inspection Laurentides-Lanaudière</h1>
        </div>
      </header>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Bouton MDSA */}
        <button 
          onClick={() => onFormSelect('form1')}
          className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center"
          aria-label="Démarrer l'inspection MDSA"
        >
          <div className="bg-[#b22a2e]/10 p-4 rounded-full mb-4">
            <ClipboardCheck size={48} className="text-[#b22a2e]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Inspection MDSA</h2>
          <p className="text-gray-600 text-sm mb-4">Vérification du moniteur défibrillateur.</p>
          <ChevronRight className="mt-auto text-[#b22a2e]" />
        </button>
        
        {/* Bouton Médical */}
        <button 
          onClick={() => onFormSelect('form2')}
          className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center"
           aria-label="Démarrer l'inspection Médicale"
       >
          <div className="bg-[#102947]/10 p-4 rounded-full mb-4">
            <ClipboardCheck size={48} className="text-[#102947]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Inspection Médicale</h2>
          <p className="text-gray-600 text-sm mb-4">Vérification du matériel clinique de l'ambulance.</p>
          <ChevronRight className="mt-auto text-[#102947]" />
        </button>
        
        {/* Bouton Mécanique */}
        <button 
          onClick={() => onFormSelect('form3')}
          className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center"
          aria-label="Démarrer l'inspection Mécanique"
        >
          <div className="bg-[#4f6683]/10 p-4 rounded-full mb-4">
            <ClipboardCheck size={48} className="text-[#4f6683]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Inspection Mécanique</h2>
          <p className="text-gray-600 text-sm mb-4">Vérification des défectuosités du véhicule.</p>
          <ChevronRight className="mt-auto text-[#4f6683]" />
        </button>
      </div>
      
      <footer className="mt-10 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} CAMBI · Inspection Laurentides-Lanaudière v1.2</p>
      </footer>
    </div>
  );
};

export default HomePage; 