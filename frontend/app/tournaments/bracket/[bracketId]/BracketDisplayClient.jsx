// frontend/app/tournaments/bracket/[bracketId]/BracketDisplayClient.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import MatchModal from '../../../components/MatchModal'; 
import { 
    getBracketDetailsById, 
    approveMatchLaga, 
    updateMatchLagaDetails, 
    approveMatchSeni, 
    updateMatchSeniDetails 
} from '../../../../services/api'; 

// Fungsi untuk mengelompokkan match berdasarkan ronde
const groupMatchesByRound = (matches) => {
    if (!matches || matches.length === 0) return [];
    
    const rounds = matches.reduce((acc, match) => {
        const roundKey = `round-${match.ronde}`;
        if (!acc[roundKey]) {
            acc[roundKey] = [];
        }
        acc[roundKey].push(match);
        // Urutkan match dalam ronde
        acc[roundKey].sort((a, b) => a.match_order_in_round - b.match_order_in_round);
        return acc;
    }, {});
    
    return Object.values(rounds);
};

export default function BracketDisplayClient({ bracketId, initialBracketDetails, initialDewanList }) {
    const [rounds, setRounds] = useState([]);
    const [bracketInfo, setBracketInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State dan Handler untuk fungsionalitas modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [modalNotification, setModalNotification] = useState('');

    const refreshBracketData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getBracketDetailsById(bracketId);
            if (data && data.data && data.data.matches) {
                setRounds(groupMatchesByRound(data.data.matches));
                setBracketInfo(data.data);
            } else {
                setRounds([]);
                setBracketInfo(null);
                if (data && !data.data) throw new Error("Format respons API tidak valid");
            }
        } catch (err) {
            setError(err.message || "Gagal mengambil data dari server.");
        } finally {
            setLoading(false);
        }
    }, [bracketId]);

    useEffect(() => {
        if (initialBracketDetails && initialBracketDetails.data) {
            setRounds(groupMatchesByRound(initialBracketDetails.data.matches));
            setBracketInfo(initialBracketDetails.data);
            setLoading(false);
        } else if (initialBracketDetails && !initialBracketDetails.data) {
             setError("Data bracket tidak ditemukan atau format salah dari server.");
             setLoading(false);
        } else {
            refreshBracketData();
        }
    }, [initialBracketDetails, refreshBracketData]);

    const handleMatchClick = (match) => {
        if (match.status !== 'bye') {
            setSelectedMatch(match);
            setIsModalOpen(true);
            setModalNotification('');
        }
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMatch(null);
    };

    const handleApproveMatch = async (matchId, choosenDewanId) => {
        if (!bracketInfo || !bracketInfo.tipe_kompetisi) return;
        setModalNotification('Sedang mengapprove match...');
        try {
            if (bracketInfo.tipe_kompetisi === 'laga') {
                await approveMatchLaga(matchId, { idDewan: choosenDewanId });
            } else {
                await approveMatchSeni(matchId, { idDewan: choosenDewanId });
            }
            setModalNotification(`Match berhasil diapprove!`);
            await refreshBracketData();
        } catch (err) {
            setModalNotification(`Gagal approve: ${err.message}`);
        }
    };
    
    const handleUpdateMatch = async (matchId, details) => {
        if (!bracketInfo || !bracketInfo.tipe_kompetisi) return;
        setModalNotification('Sedang menyimpan hasil...');
        try {
            if (bracketInfo.tipe_kompetisi === 'laga') {
                await updateMatchLagaDetails(matchId, details);
            } else {
                await updateMatchSeniDetails(matchId, details);
            }
            setModalNotification('Hasil match berhasil disimpan!');
            await refreshBracketData();
        } catch (err) {
            setModalNotification(`Gagal menyimpan: ${err.message}`);
        }
    };

    if (loading) return <p>Memuat bracket...</p>;
    if (error) return <p style={{ color: 'red' }}>Gagal memuat data bracket: {error}</p>;
    if (rounds.length === 0) return <p>Tidak ada pertandingan untuk ditampilkan.</p>;

    return (
        <>
            <button onClick={refreshBracketData} disabled={loading} style={{ marginBottom: '1rem', padding: '8px 16px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>
                {loading ? 'Memuat...' : 'Muat Ulang'}
            </button>
            
            <div className="bracket-container">
                {rounds.map((roundMatches, roundIndex) => (
                    <div className="round" key={`round-${roundIndex}`}>
                        <h3 className="round-title">Babak {roundIndex + 1}</h3>
                        <div className="matches-list">
                            {roundMatches.map((match) => {
                                const isClickable = match.status !== 'bye';
                                const isApproved = match.is_approved;
                                const isBye = match.status === 'bye';
                                const winnerId = match.pemenang?.id;

                                const teamBoxStyle = (participant, isWinner) => ({
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem',
                                    backgroundColor: isWinner ? '#f0fdf4' : 'transparent', color: isWinner ? '#166534' : '#1f2937',
                                    fontWeight: isWinner ? 600 : 400, fontSize: '14px', minHeight: '38px',
                                });

                                return (
                                    <div className="match-wrapper" key={match.id}>
                                        <div 
                                            className={`match-box ${isClickable ? 'clickable' : ''}`} 
                                            style={{ border: isApproved ? '2px solid #22c55e' : '1px solid #cbd5e1' }}
                                            onClick={() => isClickable && handleMatchClick(match)}
                                        >
                                            <div style={teamBoxStyle(match.pesertaMerah, winnerId === match.pesertaMerah?.id)}>
                                                <span>{match.pesertaMerah?.nama || (isBye && winnerId === match.pesertaBiru?.id ? '(BYE)' : 'TBD')}</span>
                                                <span style={{fontWeight: 600}}>{match.skor_merah}</span>
                                            </div>
                                            <div style={{height: '1px', backgroundColor: '#e2e8f0'}}></div>
                                            <div style={teamBoxStyle(match.pesertaBiru, winnerId === match.pesertaBiru?.id)}>
                                                <span>{match.pesertaBiru?.nama || (isBye && winnerId === match.pesertaMerah?.id ? '(BYE)' : 'TBD')}</span>
                                                <span style={{fontWeight: 600}}>{match.skor_biru}</span>
                                            </div>

                                            {(isApproved && (match.partai || match.dewan?.nama)) && (
                                                <div className="match-footer">
                                                    {match.partai && <span>Partai: {match.partai}</span>}
                                                    {match.dewan?.nama && <span>Dewan: {match.dewan.nama}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && selectedMatch && (
                <MatchModal
                    match={selectedMatch}
                    dewanList={initialDewanList}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onApprove={handleApproveMatch}
                    onUpdateDetails={handleUpdateMatch}
                    notification={modalNotification}
                    setNotification={setModalNotification}
                />
            )}
            
            <style jsx global>{`
                .bracket-container {
                    display: flex;
                    flex-direction: row;
                    align-items: stretch; /* Membuat semua kolom sama tinggi */
                    overflow-x: auto;
                    background-color: #f8fafc;
                    padding: 2rem;
                }
                .round {
                    display: flex;
                    flex-direction: column;
                    width: 250px;
                    flex-shrink: 0;
                    margin-right: 5rem; /* Jarak antar babak */
                }
                .round:last-child {
                    margin-right: 0;
                }
                .round-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    text-align: center;
                    color: #475569;
                    margin-bottom: 2.5rem;
                }
                .matches-list {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-around; /* Kunci alignment vertikal */
                    flex-grow: 1;
                    gap: 2rem; /* Jarak minimal antar match */
                }
                .match-wrapper {
                    position: relative; /* Anchor untuk pseudo-elements */
                    display: flex;
                    align-items: center;
                }
                .match-box {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    background-color: white;
                    border-radius: 0.375rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    transition: border-color 0.2s;
                    overflow: hidden;
                    z-index: 1; /* Pastikan matchbox di atas garis */
                }
                .match-box.clickable:hover {
                    cursor: pointer;
                    border-color: #3b82f6 !important;
                }
                .match-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #f1f5f9;
                    padding: 4px 8px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #475569;
                    background-color: #f8fafc;
                }

                /* CSS untuk Garis Bracket */
                .round:not(:last-child) .match-wrapper::after {
                    content: '';
                    position: absolute;
                    left: 100%;
                    top: 50%;
                    width: 2.5rem;
                    height: 2px;
                    background-color: #cbd5e1;
                }
                .matches-list > .match-wrapper:nth-child(odd)::before {
                    content: '';
                    position: absolute;
                    left: calc(100% + 2.5rem);
                    top: 50%;
                    width: 2.5rem;
                    height: calc(50% + 1rem + 1px); /* Disesuaikan dengan setengah gap */
                    border-left: 2px solid #cbd5e1;
                    border-bottom: 2px solid #cbd5e1;
                    border-bottom-left-radius: 0.5rem;
                }
                .matches-list > .match-wrapper:nth-child(even)::before {
                    content: '';
                    position: absolute;
                    left: calc(100% + 2.5rem);
                    bottom: 50%;
                    width: 2.5rem;
                    height: calc(50% + 1rem + 1px); /* Disesuaikan dengan setengah gap */
                    border-left: 2px solid #cbd5e1;
                    border-top: 2px solid #cbd5e1;
                    border-top-left-radius: 0.5rem;
                }
                .matches-list > .match-wrapper:last-child:nth-child(odd)::before {
                    display: none;
                }
            `}</style>
        </>
    );
}