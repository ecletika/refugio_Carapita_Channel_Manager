"use client";
import React, { useState, useEffect, useRef } from 'react';
import type { Quarto, FotoObj, Comodidade } from '@/components/admin/quartos/types';
import { EDGE_URL, parseFotos, parseComodidades, serializeFotos, normalize, DEFAULT_CATS } from '@/components/admin/quartos/helpers';

export function useQuartos() {
    const [quartos, setQuartos]             = useState<Quarto[]>([]);
    const [loading, setLoading]             = useState(true);
    const [editQuarto, setEditQuarto]       = useState<Partial<Quarto> | null>(null);
    const [fotosEdit, setFotosEdit]         = useState<FotoObj[]>([]);
    const [comodidadesEdit, setComodidadesEdit] = useState<string[]>([]);
    const [customComodidade, setCustomComodidade] = useState('');
    const [urlInput, setUrlInput]           = useState('');
    const [uploading, setUploading]         = useState(false);
    const fileInputRef                      = useRef<HTMLInputElement>(null);
    const [lightbox, setLightbox]           = useState<{ fotos: string[]; index: number } | null>(null);
    const [savingId, setSavingId]           = useState<string | null>(null);
    const [allComodidades, setAllComodidades] = useState<Comodidade[]>([]);
    const [newComodidadeCat, setNewComodidadeCat] = useState('Comodidades');
    const [loadingGlobal, setLoadingGlobal] = useState(true);

    const isGlobalMatch = (s: string) => allComodidades.some(c => normalize(c.nome) === normalize(s));
    const allCats = Array.from(new Set([...DEFAULT_CATS, ...allComodidades.map(c => c.categoria)]));

    /* ── Fetch ── */
    const fetchComodidades = async () => {
        setLoadingGlobal(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        try {
            const resp = await fetch(`${EDGE_URL}/admin-comodidades`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await resp.json();
            if (data.status === 'success') setAllComodidades(data.data);
        } catch (e) { console.error(e); }
        finally { setLoadingGlobal(false); }
    };

    const fetchQuartos = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        try {
            const resp = await fetch(`${EDGE_URL}/admin-quartos`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await resp.json();
            if (data.status === 'success') setQuartos(data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchQuartos(); fetchComodidades(); }, []);

    /* ── Modal open ── */
    const openEdit = (q?: Partial<Quarto>) => {
        const quarto = q || {
            nome: '', tipo: 'Quarto', descricao: '', capacidade: 2,
            preco_base: 100, tarifa_semana: 100, tarifa_fds: 120,
            ativo: true, minima_estadia_padrao: 2,
        };
        setEditQuarto(quarto);
        setFotosEdit(parseFotos(quarto.fotos));
        setComodidadesEdit(parseComodidades(quarto.comodidades));
        setCustomComodidade('');
        setUrlInput('');
    };

    /* ── Fotos ── */
    const addUrlFoto = () => {
        const trimmed = urlInput.trim();
        if (!trimmed) return;
        setFotosEdit(prev => [...prev, { url: trimmed, category: 'Quarto', isMain: prev.length === 0 }]);
        setUrlInput('');
    };

    const removeFoto = (idx: number) => setFotosEdit(prev => prev.filter((_, i) => i !== idx));

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        const token = localStorage.getItem('token');
        const newUrls: string[] = [];
        for (const file of files) {
            const formData = new FormData();
            formData.append('foto', file);
            try {
                const resp = await fetch(`${EDGE_URL}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                const data = await resp.json();
                if (data.url) newUrls.push(data.url);
            } catch { alert(`Erro ao fazer upload de ${file.name}`); }
        }
        setFotosEdit(prev => [...prev, ...newUrls.map((url, i) => ({
            url, category: 'Quarto', isMain: prev.length === 0 && i === 0
        }))]);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    /* ── Comodidades ── */
    const toggleComodidade = (item: string) =>
        setComodidadesEdit(prev => {
            const n = normalize(item);
            return prev.some(c => normalize(c) === n) ? prev.filter(c => normalize(c) !== n) : [...prev, item];
        });

    const addCustomComodidade = async () => {
        const trimmed = customComodidade.trim();
        if (!trimmed) return;
        let cat = newComodidadeCat;
        if (cat === 'NOVA') {
            const nc = prompt("Nova categoria (ex: Sala de jantar):");
            if (!nc) return;
            cat = nc;
            setNewComodidadeCat(nc);
        }
        if (comodidadesEdit.some(c => normalize(c) === normalize(trimmed))) { setCustomComodidade(''); return; }
        if (!allComodidades.find(c => normalize(c.nome) === normalize(trimmed))) {
            const token = localStorage.getItem('token');
            try {
                const resp = await fetch(`${EDGE_URL}/admin-comodidades`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ nome: trimmed, categoria: cat }),
                });
                if (resp.ok) await fetchComodidades();
            } catch (e) { console.error(e); }
        }
        setComodidadesEdit(prev => [...prev, trimmed]);
        setCustomComodidade('');
    };

    const registerGlobally = async (nome: string) => {
        const cat = prompt(`Categoria para "${nome}":`, "Comodidades");
        if (!cat) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${EDGE_URL}/admin-comodidades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome, categoria: cat }),
            });
            await fetchComodidades();
        } catch { alert("Erro de conexão."); }
    };

    /* ── CRUD ── */
    const handleToggleAtivo = async (q: Quarto) => {
        setSavingId(q.id);
        const token = localStorage.getItem('token');
        try {
            await fetch(`${EDGE_URL}/admin-quartos/${q.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    nome: q.nome, tipo: q.tipo, descricao: q.descricao,
                    capacidade: q.capacidade, precoBase: q.preco_base,
                    fotos: q.fotos, comodidades: q.comodidades,
                    ativo: !q.ativo, videoUrl: q.video_url, icalUrl: q.ical_url,
                }),
            });
            fetchQuartos();
        } catch { console.error("Erro ao alternar status"); }
        finally { setSavingId(null); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const method = editQuarto?.id ? 'PUT' : 'POST';
        const url = editQuarto?.id ? `${EDGE_URL}/admin-quartos/${editQuarto.id}` : `${EDGE_URL}/admin-quartos`;
        try {
            const resp = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    nome: editQuarto?.nome, tipo: editQuarto?.tipo, descricao: editQuarto?.descricao,
                    capacidade: editQuarto?.capacidade, precoBase: editQuarto?.preco_base,
                    tarifaSemana: editQuarto?.tarifa_semana, tarifaFds: editQuarto?.tarifa_fds,
                    fotos: serializeFotos(fotosEdit), comodidades: JSON.stringify(comodidadesEdit),
                    ativo: editQuarto?.ativo, videoUrl: editQuarto?.video_url,
                    icalUrl: editQuarto?.ical_url, minimaEstadiaPadrao: editQuarto?.minima_estadia_padrao,
                }),
            });
            if (resp.ok) { setEditQuarto(null); fetchQuartos(); }
            else alert('Erro ao gravar. Verifique se está autenticado.');
        } catch { alert("Erro ao salvar alojamento"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Apagar este alojamento? Todos os dados associados serão perdidos.")) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${EDGE_URL}/admin-quartos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            fetchQuartos();
        } catch { alert("Erro ao apagar"); }
    };

    const handleSync = async (id: string) => {
        const token = localStorage.getItem('token');
        const quarto = quartos.find(q => q.id === id);
        try {
            const resp = await fetch(`${EDGE_URL}/sync-ical`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ quartoId: id, url: quarto?.ical_url }),
            });
            const data = await resp.json();
            alert(data.message || "Sincronização concluída");
        } catch { alert("Erro ao sincronizar"); }
    };

    return {
        quartos, loading,
        editQuarto, setEditQuarto, fotosEdit, setFotosEdit,
        comodidadesEdit, setComodidadesEdit,
        customComodidade, setCustomComodidade,
        urlInput, setUrlInput,
        uploading, fileInputRef,
        lightbox, setLightbox,
        savingId,
        allComodidades, newComodidadeCat, setNewComodidadeCat, loadingGlobal,
        allCats, isGlobalMatch,
        openEdit, addUrlFoto, removeFoto, handleFileUpload,
        toggleComodidade, addCustomComodidade, registerGlobally,
        handleToggleAtivo, handleSave, handleDelete, handleSync,
    };
}
