// frontend/services/api.js

// Pastikan BE di port 3000 dan FE di port 3001
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    if (response.status === 204) { // No Content
        return null;
    }
    return response.json();
  } catch (error) {
    console.error(`Kesalahan panggilan API ke ${endpoint}:`, error);
    throw error;
  }
}

// --- Kategori API (Kategori Usia/Tingkat) ---
export const getAllKategori = (params = {}) => request(`/kategori?${new URLSearchParams(params)}`);
export const getKategoriById = (id) => request(`/kategori/${id}`);
export const createKategori = (data) => request('/kategori', { method: 'POST', body: JSON.stringify(data) });
export const updateKategori = (id, data) => request(`/kategori/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteKategori = (id) => request(`/kategori/${id}`, { method: 'DELETE' });

// --- Kontingen API ---
export const getAllKontingen = (params = {}) => request(`/kontingen?${new URLSearchParams(params)}`);
export const getKontingenById = (id) => request(`/kontingen/${id}`);
export const createKontingen = (data) => request('/kontingen', { method: 'POST', body: JSON.stringify(data) });
export const updateKontingen = (id, data) => request(`/kontingen/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteKontingen = (id) => request(`/kontingen/${id}`, { method: 'DELETE' });

// --- Dewan API ---
export const getAllDewan = (params = {}) => request(`/dewan?${new URLSearchParams(params)}`);
export const createDewan = (data) => request('/dewan', { method: 'POST', body: JSON.stringify(data) });
// Di dalam frontend/services/api.js (contoh, pastikan sudah ada)
export const updateDewan = (id, data) => request(`/dewan/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDewan = (id) => request(`/dewan/${id}`, { method: 'DELETE' });
// Tambahkan update, getById, delete untuk Dewan jika perlu

// --- Peserta API ---
export const getAllPeserta = (params = {}) => request(`/peserta?${new URLSearchParams(params)}`);
export const getPesertaById = (id) => request(`/peserta/${id}`);
export const createPeserta = (data) => request('/peserta', { method: 'POST', body: JSON.stringify(data) });
export const updatePeserta = (id, data) => request(`/peserta/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePeserta = (id) => request(`/peserta/${id}`, { method: 'DELETE' });
export const registerPesertaToLaga = (data) => request('/peserta/register-laga', { method: 'POST', body: JSON.stringify(data) });
export const registerPesertaToSeni = (data) => request('/peserta/register-seni', { method: 'POST', body: JSON.stringify(data) });

// --- Laga API (Kategori Pertandingan Laga) ---
export const getAllLaga = (params = {}) => request(`/laga?${new URLSearchParams(params)}`);
export const getLagaById = (id) => request(`/laga/${id}`);
export const createLaga = (data) => request('/laga', { method: 'POST', body: JSON.stringify(data) });
export const updateLaga = (id, data) => request(`/laga/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteLaga = (id) => request(`/laga/${id}`, { method: 'DELETE' });

// --- Seni API (Kategori Pertandingan Seni) ---
export const getAllSeni = (params = {}) => request(`/seni?${new URLSearchParams(params)}`);
export const getSeniById = (id) => request(`/seni/${id}`);
export const createSeni = (data) => request('/seni', { method: 'POST', body: JSON.stringify(data) });
export const updateSeni = (id, data) => request(`/seni/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSeni = (id) => request(`/seni/${id}`, { method: 'DELETE' });

// --- Kompetisi API (Gabungan Laga & Seni untuk daftar utama) ---
export const getAllKompetisi = (params = {}) => request(`/kompetisi?${new URLSearchParams(params)}`);

// --- Bracket API ---
export const generateBracket = (data) => request('/bracket/generate', { method: 'POST', body: JSON.stringify(data) }); // data: { idKompetisi, tipeKompetisi }
export const getBracketDetailsById = (bracketId) => request(`/bracket/${bracketId}`);
export const updateBracketStatus = (bracketId, status) => request(`/bracket/${bracketId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

// --- MatchLaga API ---
export const getMatchLagaById = (id) => request(`/match-laga/${id}`);
export const approveMatchLaga = (matchId, data) => request(`/match-laga/${matchId}/approve`, { method: 'PUT', body: JSON.stringify(data) }); // data: { idDewan }
export const updateMatchLagaDetails = (matchId, details) => request(`/match-laga/${matchId}/details`, { method: 'PUT', body: JSON.stringify(details) });

// --- MatchSeni API ---
export const getMatchSeniById = (id) => request(`/match-seni/${id}`);
export const approveMatchSeni = (matchId, data) => request(`/match-seni/${matchId}/approve`, { method: 'PUT', body: JSON.stringify(data) }); // data: { idDewan }
export const updateMatchSeniDetails = (matchId, details) => request(`/match-seni/${matchId}/details`, { method: 'PUT', body: JSON.stringify(details) });
