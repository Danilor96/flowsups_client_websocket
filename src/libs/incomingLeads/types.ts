interface SimpleValueWithAttributes {
  _: string; // El valor principal (ej: 'Pablo', '[Odometer Reading]')
  $: {
    part?: 'first' | 'last'; // Para el nombre
    units?: 'mi' | string; // Para el odómetro
  };
}

// --- 2. Interfaces de Nivel Inferior ---

interface ADFProvider {
  name: string;
  service: string; // Basado en '[]', es probable que sea una cadena que representa un array vacío o un valor de texto.
  url: string;
}

interface ADFVendor {
  vendorname: string;
}

interface ADFContact {
  // El campo 'name' es un array de objetos SimpleValueWithAttributes
  name: SimpleValueWithAttributes[];
  email: string;
  phone: string;
}

interface ADFCustomer {
  contact: ADFContact;
  comments: string;
}

interface ADFVehicle {
  $: {
    interest: 'buy' | string;
    status: 'used' | 'new' | string;
  };
  make: string;
  model: string;
  year: string;
  // El campo 'odometer' es un objeto SimpleValueWithAttributes
  odometer: SimpleValueWithAttributes;
  trim: string;
}

// --- 3. Interfaz de Nivel Medio (Prospect) ---

interface ADFProspect {
  requestdate: string; // Basado en '[]', es probablemente una cadena
  provider: ADFProvider;
  vendor: ADFVendor;
  customer: ADFCustomer;
  vehicle: ADFVehicle;
}

// --- 4. Interfaz Raíz ---

export interface ADFData {
  prospect: ADFProspect;
}
