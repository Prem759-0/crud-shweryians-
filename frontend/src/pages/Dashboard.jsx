import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import api from '../api/axiosInstance';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, product, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: '15px',
    cursor: 'grab',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div 
        className="brutal-panel"
        style={{ padding: '15px', background: '#fff', border: '3px solid #000', position: 'relative' }}
        whileHover={{ scale: 1.02, boxShadow: '4px 4px 0px #000' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <span style={{ fontSize: '32px' }}>{product.emoji || '📦'}</span>
          <h3 style={{ color: 'var(--accent-color)', fontSize: '24px' }}>{product.name}</h3>
        </div>
        <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>{product.description}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', marginBottom: '10px' }}>
          <span style={{ fontSize: '20px' }}>${product.price}</span>
          <span style={{ fontSize: '14px', background: 'var(--primary-bg)', padding: '4px 8px', borderRadius: '4px', border: '2px solid #000' }}>
            Stock: {product.stock}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }} onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit(product)} className="btn-brutal" style={{ flex: 1, padding: '8px', fontSize: '14px', background: 'var(--accent-color)' }}>
            ✏️ EDIT
          </button>
          <button onClick={() => onDelete(product._id)} className="btn-brutal btn-danger" style={{ flex: 1, padding: '8px', fontSize: '14px' }}>
            🗑️ DEL
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const [products, setProducts] = useState({
    AVAILABLE: [],
    LOW_STOCK: [],
    OUT_OF_STOCK: []
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', emoji: '📦', status: 'AVAILABLE' });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      const allProducts = res.data;
      
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const userProducts = allProducts.filter(p => p.user._id === currentUser.id || p.user === currentUser.id);

      const grouped = { AVAILABLE: [], LOW_STOCK: [], OUT_OF_STOCK: [] };
      userProducts.forEach(p => {
        if (grouped[p.status]) {
          grouped[p.status].push(p);
        } else {
          grouped.AVAILABLE.push(p); // Fallback
        }
      });
      setProducts(grouped);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setFormData({ name: product.name, description: product.description, price: product.price, stock: product.stock, emoji: product.emoji || '📦', status: product.status || 'AVAILABLE' });
      setEditingId(product._id);
    } else {
      setFormData({ name: '', description: '', price: '', stock: '', emoji: '📦', status: 'AVAILABLE' });
      setEditingId(null);
    }
    setIsModalOpen(true);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingId ? 'Updating...' : 'Creating...');
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
        toast.success('Product updated! 🎉', { id: loadingToast });
      } else {
        await api.post('/products', formData);
        toast.success('Product created! 🚀', { id: loadingToast });
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving product', { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? 💥')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted! 🗑️');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting product');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId || over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Moved to different column
    const activeProduct = products[activeContainer].find(p => p._id === active.id);
    
    // Optimistic UI update
    setProducts(prev => {
      const newActive = prev[activeContainer].filter(p => p._id !== active.id);
      const newOver = [...prev[overContainer], { ...activeProduct, status: overContainer }];
      return { ...prev, [activeContainer]: newActive, [overContainer]: newOver };
    });

    try {
      await api.put(`/products/${active.id}`, { ...activeProduct, status: overContainer });
      toast.success(`Moved to ${overContainer.replace('_', ' ')}!`);
    } catch (error) {
      toast.error('Failed to move product');
      fetchProducts(); // Revert on failure
    }
  };

  const columns = [
    { id: 'AVAILABLE', title: 'IN STOCK ✨', color: '#6BCB77' },
    { id: 'LOW_STOCK', title: 'LOW STOCK ⚠️', color: '#FFD93D' },
    { id: 'OUT_OF_STOCK', title: 'SOLD OUT ❌', color: '#FF6B6B' },
  ];

  return (
    <div className="page-container" style={{ padding: '40px 20px', width: '100vw', display: 'block' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="brutal-panel" style={{ padding: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ fontSize: '40px' }}>📦 INVENTORY HQ</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-brutal btn-success" onClick={() => handleOpenModal()}>
              + ADD ITEM 🌟
            </button>
            <button className="btn-brutal btn-danger" onClick={handleLogout}>
              LOGOUT 🚪
            </button>
          </div>
        </div>

        {/* Kanban Board Container */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {columns.map(col => (
              <div key={col.id} className="kanban-column" style={{ background: col.color, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '4px solid #000', paddingBottom: '10px' }}>{col.title}</h2>
                <SortableContext id={col.id} items={products[col.id].map(p => p._id)} strategy={verticalListSortingStrategy}>
                  <div style={{ flex: 1, minHeight: '150px' }}>
                    {products[col.id].map(product => (
                      <SortableItem key={product._id} id={product._id} product={product} onEdit={handleOpenModal} onDelete={handleDelete} />
                    ))}
                    {products[col.id].length === 0 && (
                      <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '20px', border: '3px dashed #000', borderRadius: '8px', opacity: 0.7 }}>
                        DROP HERE!
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>
        </DndContext>
      </div>

      {/* Floating Modal for Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="brutal-panel"
              style={{ width: '90%', maxWidth: '450px', padding: '30px', background: '#FFE57F', position: 'relative' }}
              initial={{ y: -100, rotate: -5, opacity: 0 }}
              animate={{ y: 0, rotate: 0, opacity: 1 }}
              exit={{ y: 100, rotate: 5, opacity: 0 }}
            >
              <h3 style={{ marginBottom: '20px', fontSize: '32px' }}>{editingId ? 'EDIT ITEM ✏️' : 'NEW ITEM 🚀'}</h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="btn-brutal" style={{ fontSize: '24px', padding: '5px 15px', background: '#fff' }}>
                      {formData.emoji}
                    </button>
                    {showEmojiPicker && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: '5px', border: '3px solid #000', borderRadius: '8px' }}>
                        <EmojiPicker onEmojiClick={(e) => { setFormData({...formData, emoji: e.emoji}); setShowEmojiPicker(false); }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>NAME</label>
                    <input type="text" className="input-brutal" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>DESC</label>
                  <textarea className="input-brutal" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="2" required />
                </div>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>PRICE ($)</label>
                    <input type="number" step="0.01" className="input-brutal" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'var(--font-modern)' }}>STOCK</label>
                    <input type="number" className="input-brutal" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-brutal" style={{ flex: 1, background: '#fff', color: '#000' }}>CANCEL</button>
                  <button type="submit" className="btn-brutal btn-success" style={{ flex: 1 }}>{editingId ? 'UPDATE' : 'CREATE'} 🔥</button>
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
