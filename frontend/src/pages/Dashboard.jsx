import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import QRCodePkg from 'react-qr-code';
const QRCode = QRCodePkg.default || QRCodePkg;
import { Scanner } from '@yudiel/react-qr-scanner';
import ConfettiPkg from 'react-confetti';
const Confetti = ConfettiPkg.default || ConfettiPkg;
import api from '../api/axiosInstance';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Notification helper ──────────────────────────────────────────────────────
let _notify = null;
function Notifications({ setRef }) {
  const [notes, setNotes] = useState([]);
  setRef((msg, type = 'success') => {
    const id = Date.now();
    setNotes(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotes(prev => prev.filter(n => n.id !== id)), 3000);
  });
  const colors = { success: 'var(--accent-green)', error: 'var(--secondary-bg)', info: 'var(--accent-color)' };
  return (
    <div style={{ position: 'fixed', top: '50px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <AnimatePresence>
        {notes.map(n => (
          <motion.div key={n.id}
            initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
            style={{ background: colors[n.type] || colors.success, border: 'var(--border-thick)', boxShadow: '4px 4px 0 #000', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', fontFamily: 'var(--font-modern)', maxWidth: '300px', color: '#fff' }}>
            {n.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Sortable Product Card ────────────────────────────────────────────────────
function SortableItem({ id, product, onEdit, onDelete, onViewQR }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, marginBottom: '14px', opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 999 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div className="brutal-panel"
        style={{ padding: '16px', cursor: 'grab', position: 'relative' }}
        whileHover={{ scale: 1.02, boxShadow: '5px 5px 0px var(--border-color)' }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onViewQR(product); }}
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', filter: 'drop-shadow(2px 2px 0px #000)' }}
          title="View QR Code"
        >
          🔲
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '28px' }}>{product.emoji || '📦'}</span>
          <h3 style={{ fontSize: '20px', color: 'var(--accent-color)' }}>{product.name}</h3>
        </div>
        <p style={{ fontSize: '14px', fontFamily: 'var(--font-modern)', marginBottom: '10px', lineHeight: '1.4' }}>{product.description}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>
          <span style={{ fontSize: '20px' }}>${Number(product.price).toFixed(2)}</span>
          <span style={{ background: 'var(--primary-bg)', color: 'var(--text-main)', border: '2px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>
            Stock: {product.stock}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }} onPointerDown={e => e.stopPropagation()}>
          <button onClick={() => onEdit(product)} className="btn-brutal" style={{ flex: 1, padding: '7px', fontSize: '13px' }}>✏️ EDIT</button>
          <button onClick={() => onDelete(product._id)} className="btn-brutal btn-danger" style={{ flex: 1, padding: '7px', fontSize: '13px' }}>🗑️ DEL</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const [products, setProducts] = useState({ AVAILABLE: [], LOW_STOCK: [], OUT_OF_STOCK: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', emoji: '📦', status: 'AVAILABLE' });
  const [editingId, setEditingId] = useState(null);
  
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // QR & Confetti features
  const [qrModal, setQrModal] = useState({ isOpen: false, product: null });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const navigate = useNavigate();

  // Notification ref
  const notifyRef = React.useRef(null);
  const notify = useCallback((msg, type) => { if (notifyRef.current) notifyRef.current(msg, type); }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const mine = res.data.filter(p => {
        const uid = p.user?._id || p.user;
        return String(uid) === String(currentUser.id);
      });
      const grouped = { AVAILABLE: [], LOW_STOCK: [], OUT_OF_STOCK: [] };
      mine.forEach(p => {
        const col = grouped[p.status] ? p.status : 'AVAILABLE';
        grouped[col].push(p);
      });
      setProducts(grouped);
    } catch (err) {
      notify('❌ Failed to load products', 'error');
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const openModal = (product = null) => {
    if (product) {
      setFormData({ name: product.name, description: product.description, price: product.price, stock: product.stock, emoji: product.emoji || '📦', status: product.status || 'AVAILABLE' });
      setEditingId(product._id);
    } else {
      setFormData({ name: '', description: '', price: '', stock: '', emoji: '📦', status: 'AVAILABLE' });
      setEditingId(null);
    }
    setShowEmojiPicker(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, price: Number(formData.price), stock: Number(formData.stock) };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        notify('✅ Product updated!', 'success');
      } else {
        await api.post('/products', payload);
        notify('🚀 Product created!', 'success');
        // Trigger confetti!
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      notify('❌ ' + (err.response?.data?.message || 'Error saving product'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? 💥')) return;
    try {
      await api.delete(`/products/${id}`);
      notify('🗑️ Product deleted!', 'success');
      fetchProducts();
    } catch (err) {
      notify('❌ ' + (err.response?.data?.message || 'Error deleting'), 'error');
    }
  };

  const findColumn = (id) => {
    for (const col of Object.keys(products)) {
      if (products[col].find(p => p._id === id)) return col;
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const col = findColumn(active.id);
    if (col) setActiveItem(products[col].find(p => p._id === active.id));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;

    const activeCol = findColumn(active.id);
    let overCol = Object.keys(products).includes(String(over.id)) ? String(over.id) : findColumn(over.id);

    if (!activeCol || !overCol || activeCol === overCol) return;

    const movedProduct = products[activeCol].find(p => p._id === active.id);

    // Optimistic update
    setProducts(prev => ({
      ...prev,
      [activeCol]: prev[activeCol].filter(p => p._id !== active.id),
      [overCol]: [...prev[overCol], { ...movedProduct, status: overCol }]
    }));

    try {
      await api.put(`/products/${active.id}`, { ...movedProduct, status: overCol, price: Number(movedProduct.price), stock: Number(movedProduct.stock) });
      notify(`✅ Moved to ${overCol.replace('_', ' ')}!`, 'success');
    } catch (_) {
      notify('❌ Failed to move product', 'error');
      fetchProducts(); // revert
    }
  };
  
  const handleScan = (result) => {
    if (result && result[0]) {
      const scannedId = result[0].rawValue;
      // Find product by id
      const col = findColumn(scannedId);
      if (col) {
        const prod = products[col].find(p => p._id === scannedId);
        notify(`🔍 Found product: ${prod.name}`, 'info');
        setScannerOpen(false);
        openModal(prod);
      } else {
        notify('❌ Product not found in your inventory', 'error');
      }
    }
  };

  const columns = [
    { id: 'AVAILABLE', title: 'IN STOCK ✨', color: '#6BCB77' },
    { id: 'LOW_STOCK', title: 'LOW STOCK ⚠️', color: '#FFD93D' },
    { id: 'OUT_OF_STOCK', title: 'SOLD OUT ❌', color: '#FF6B6B' },
  ];

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  return (
    <div className="page-container" style={{ padding: '30px 20px', alignItems: 'flex-start', width: '100vw', minHeight: '100vh', display: 'block' }}>
      <Notifications setRef={fn => { notifyRef.current = fn; }} />
      {showConfetti && <Confetti style={{ zIndex: 99999 }} recycle={false} numberOfPieces={500} />}

      <div style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '20px' }}>
        {/* Header */}
        <motion.div className="brutal-panel"
          style={{ padding: '20px 30px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}
          initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        >
          <div>
            <h1 style={{ fontSize: '36px', marginBottom: '4px' }}>📦 INVENTORY HQ</h1>
            <p style={{ fontFamily: 'var(--font-modern)', fontWeight: 'bold', fontSize: '14px' }}>
              Welcome back, <span style={{ color: 'var(--accent-color)' }}>{currentUser.name || 'Hero'}</span>!
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn-brutal btn-success" onClick={() => openModal()}>
              + ADD ITEM 🌟
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn-brutal" style={{ background: '#FFE57F', color: '#000' }} onClick={() => setScannerOpen(true)}>
              📷 SCAN QR
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn-brutal btn-danger" onClick={handleLogout}>
              LOGOUT 🚪
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
          {columns.map((col, idx) => (
            <motion.div key={col.id} className="brutal-panel"
              style={{ flex: 1, minWidth: '150px', padding: '15px 20px', background: col.color, textAlign: 'center', color: '#000' }}
              initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: 'var(--font-comic)' }}>{products[col.id].length}</div>
              <div style={{ fontFamily: 'var(--font-modern)', fontWeight: 'bold', fontSize: '14px' }}>{col.title}</div>
            </motion.div>
          ))}
        </div>

        {/* Kanban Board */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {columns.map(col => (
              <motion.div key={col.id}
                id={col.id}
                className="brutal-panel"
                style={{ padding: '20px', background: col.color, minHeight: '400px', display: 'flex', flexDirection: 'column' }}
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              >
                <h2 style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '4px solid #000', paddingBottom: '12px', fontSize: '24px', color: '#000' }}>
                  {col.title}
                </h2>
                <SortableContext id={col.id} items={products[col.id].map(p => p._id)} strategy={verticalListSortingStrategy}>
                  <div style={{ flex: 1 }}>
                    {products[col.id].map(product => (
                      <SortableItem key={product._id} id={product._id} product={product} onEdit={openModal} onDelete={handleDelete} onViewQR={(p) => setQrModal({ isOpen: true, product: p })} />
                    ))}
                    {products[col.id].length === 0 && (
                      <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '30px 20px', border: '4px dashed rgba(0,0,0,0.3)', borderRadius: '8px', opacity: 0.8, fontFamily: 'var(--font-modern)', color: '#000' }}>
                        DROP HERE! 🎯
                      </div>
                    )}
                  </div>
                </SortableContext>
              </motion.div>
            ))}
          </div>
          <DragOverlay>
            {activeItem ? (
              <div style={{ background: 'var(--panel-bg)', color: 'var(--text-main)', border: 'var(--border-thick)', padding: '16px', borderRadius: '8px', boxShadow: '8px 8px 0 var(--border-color)', opacity: 0.95, transform: 'rotate(3deg)' }}>
                <span style={{ fontSize: '28px' }}>{activeItem.emoji}</span> <strong style={{ fontSize: '20px', fontFamily: 'var(--font-comic)' }}>{activeItem.name}</strong>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ────────────────── MODALS ────────────────── */}

      {/* 1. QR Code Scanner Modal */}
      <AnimatePresence>
        {scannerOpen && (
          <motion.div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="brutal-panel" style={{ padding: '30px', width: '90%', maxWidth: '400px', textAlign: 'center' }}
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <h2 style={{ marginBottom: '15px' }}>📷 SCAN PRODUCT QR</h2>
              <div style={{ border: 'var(--border-thick)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                <Scanner onScan={handleScan} />
              </div>
              <button className="btn-brutal btn-danger" onClick={() => setScannerOpen(false)} style={{ width: '100%' }}>CLOSE SCANNER ❌</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. View QR Code Modal */}
      <AnimatePresence>
        {qrModal.isOpen && qrModal.product && (
          <motion.div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="brutal-panel" style={{ padding: '30px', width: '90%', maxWidth: '350px', textAlign: 'center', background: '#fff' }}
              initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }}>
              <h2 style={{ marginBottom: '20px', color: '#000' }}>{qrModal.product.emoji} {qrModal.product.name}</h2>
              <div style={{ background: '#fff', padding: '15px', border: '4px solid #000', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
                <QRCode value={qrModal.product._id} size={200} />
              </div>
              <p style={{ fontFamily: 'var(--font-modern)', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>
                Scan this code to quickly edit this product!
              </p>
              <button className="btn-brutal btn-danger" onClick={() => setQrModal({ isOpen: false, product: null })} style={{ width: '100%' }}>CLOSE ❌</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <motion.div className="brutal-panel"
              style={{ width: '90%', maxWidth: '460px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}
              initial={{ y: -80, rotate: -4, opacity: 0 }}
              animate={{ y: 0, rotate: 0, opacity: 1 }}
              exit={{ y: 80, rotate: 4, opacity: 0 }}
            >
              <h3 style={{ marginBottom: '24px', fontSize: '32px' }}>{editingId ? 'EDIT ITEM ✏️' : 'NEW ITEM 🚀'}</h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>EMOJI</label>
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="btn-brutal" style={{ fontSize: '24px', padding: '8px 14px', background: 'var(--primary-bg)', color: '#000', minWidth: '60px' }}>
                      {formData.emoji}
                    </button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>PRODUCT NAME</label>
                    <input type="text" className="input-brutal" placeholder="E.g. Nike Shoes" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                </div>
                {showEmojiPicker && (
                  <div style={{ border: 'var(--border-thick)', borderRadius: '8px', overflow: 'hidden' }}>
                    <EmojiPicker onEmojiClick={(e) => { setFormData({ ...formData, emoji: e.emoji }); setShowEmojiPicker(false); }} width="100%" theme="auto" />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>DESCRIPTION</label>
                  <textarea className="input-brutal" placeholder="What is this product?" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} required style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>PRICE ($)</label>
                    <input type="number" step="0.01" min="0" className="input-brutal" placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>STOCK</label>
                    <input type="number" min="0" className="input-brutal" placeholder="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>STATUS</label>
                  <select className="input-brutal" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="AVAILABLE">✨ In Stock</option>
                    <option value="LOW_STOCK">⚠️ Low Stock</option>
                    <option value="OUT_OF_STOCK">❌ Sold Out</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-brutal" style={{ background: 'var(--secondary-bg)' }}>CANCEL</button>
                  <button type="submit" className="btn-brutal btn-success" disabled={loading}>
                    {loading ? 'SAVING...' : (editingId ? 'UPDATE 💾' : 'CREATE 🔥')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
