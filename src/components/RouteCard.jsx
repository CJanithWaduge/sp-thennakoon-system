import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Trash2, ChevronDown, Pencil, Plus } from 'lucide-react';

const RouteCard = ({
    route,
    routeInvoices,
    onDeleteRoute,
    openInstallmentModal,
    onRenameRoute,
    onRenameShop // New prop
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempRouteName, setTempRouteName] = useState(route);

    // Shop editing state
    const [editingShopId, setEditingShopId] = useState(null);
    const [tempShopName, setTempShopName] = useState('');

    const inputRef = useRef(null);
    const shopInputRef = useRef(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingName]);

    // Focus shop input when editing starts
    useEffect(() => {
        if (editingShopId && shopInputRef.current) {
            shopInputRef.current.focus();
        }
    }, [editingShopId]);

    // Update temp name if prop changes
    useEffect(() => {
        setTempRouteName(route);
    }, [route]);

    const toggleExpand = () => {
        if (!isEditingName && !editingShopId) { // Prevent toggle if editing shop
            setIsExpanded(!isExpanded);
        }
    };

    const handleStartEdit = (e) => {
        e.stopPropagation();
        setIsEditingName(true);
        setTempRouteName(route);
    };

    const handleSaveName = (e) => {
        e.stopPropagation();
        if (tempRouteName.trim() && tempRouteName !== route) {
            if (onRenameRoute) {
                onRenameRoute(route, tempRouteName.trim());
            }
        }
        setIsEditingName(false);
    };

    const handleKeyDown = (e) => {
        e.stopPropagation(); // Prevent card toggle on key press
        if (e.key === 'Enter') {
            handleSaveName(e);
        } else if (e.key === 'Escape') {
            setTempRouteName(route);
            setIsEditingName(false);
        }
    };

    const handleInputClick = (e) => {
        e.stopPropagation();
    };

    // --- Shop Rename Handlers ---
    const handleStartEditShop = (e, invoice) => {
        e.stopPropagation();
        setEditingShopId(invoice.id);
        setTempShopName(invoice.shopName);
    };

    const handleSaveShop = (e, invoiceId) => {
        e.stopPropagation();
        if (tempShopName.trim()) {
            if (onRenameShop) {
                onRenameShop(invoiceId, tempShopName.trim());
            }
        }
        setEditingShopId(null);
    };

    const handleShopKeyDown = (e, invoiceId) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            handleSaveShop(e, invoiceId);
        } else if (e.key === 'Escape') {
            setEditingShopId(null);
        }
    };

    return (
        <div style={{
            marginBottom: '20px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-color)',
            backdropFilter: 'blur(10px)'
        }}>
            {/* HEADER */}
            <div
                onClick={toggleExpand}
                style={{
                    background: 'var(--header-pill-bg)',
                    borderBottom: '1px solid var(--border-color)',
                    padding: '15px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    minHeight: '60px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Chevron Icon with rotation */}
                    <div style={{
                        transition: 'transform 0.3s ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--accent-color)'
                    }}>
                        <ChevronDown size={20} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <MapPin size={18} color="var(--accent-color)" />

                        {isEditingName ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={tempRouteName}
                                onChange={(e) => setTempRouteName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onClick={handleInputClick}
                                onBlur={handleSaveName}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--accent-color)',
                                    color: 'var(--text-main)',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    minWidth: '200px'
                                }}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    color: 'var(--text-main)',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    {route}
                                </span>
                                <button
                                    onClick={handleStartEdit}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-light)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px',
                                        opacity: 0.8
                                    }}
                                    title="Rename Route"
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Button */}
                <button
                    className="delete-icon-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRoute(route);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px'
                    }}
                    title="Delete Route"
                >
                    <Trash2 size={18} color="#ff4d4d" />
                </button>
            </div>

            {/* EXPANDABLE CONTENT */}
            <div style={{
                maxHeight: isExpanded ? '2000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease-in-out',
                background: 'transparent'
            }}>
                <div style={{ padding: '20px' }}>
                    <table className="inventory-table responsive-table-mobile" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-light)', fontSize: '11px', textTransform: 'uppercase', width: '15%' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-light)', fontSize: '11px', textTransform: 'uppercase', width: '25%' }}>Shop Name</th>
                                <th style={{ textAlign: 'right', padding: '12px', color: 'var(--text-light)', fontSize: '11px', textTransform: 'uppercase', width: '15%' }}>Total Bill</th>
                                <th style={{ textAlign: 'right', padding: '12px', color: 'var(--text-light)', fontSize: '11px', textTransform: 'uppercase', width: '15%' }}>Paid</th>
                                <th style={{ textAlign: 'right', padding: '12px', color: 'var(--text-light)', fontSize: '11px', textTransform: 'uppercase', width: '15%' }}>Remaining</th>
                                <th style={{ textAlign: 'right', padding: '12px', color: 'var(--text-light)', fontSize: '11px', textTransform: 'uppercase', width: '15%' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {routeInvoices.map(invoice => {
                                const paid = invoice.paidAmount || 0;
                                const remaining = invoice.totalBill - paid;
                                if (remaining <= 0) return null;

                                return (
                                    <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border-color)', height: '60px' }}>
                                        <td data-label="Date" style={{ padding: '12px', verticalAlign: 'middle', color: 'var(--text-light)', fontSize: '13px', textAlign: 'left' }}>
                                            {new Date(invoice.date).toLocaleDateString()}
                                        </td>

                                        {/* SHOP NAME CELL - Editable */}
                                        <td data-label="Shop" style={{ padding: '12px', verticalAlign: 'middle', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500', textAlign: 'left' }}>
                                            {editingShopId === invoice.id ? (
                                                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                    <input
                                                        ref={shopInputRef}
                                                        type="text"
                                                        value={tempShopName}
                                                        onChange={(e) => setTempShopName(e.target.value)}
                                                        onKeyDown={(e) => handleShopKeyDown(e, invoice.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onBlur={(e) => handleSaveShop(e, invoice.id)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: '1px solid var(--accent-color)',
                                                            color: 'var(--text-main)',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            outline: 'none',
                                                            width: '100%'
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
                                                    {invoice.shopName}
                                                    <button
                                                        onClick={(e) => handleStartEditShop(e, invoice)}
                                                        style={{
                                                            background: 'transparent', border: 'none', cursor: 'pointer',
                                                            opacity: 0.7, padding: '2px', display: 'flex', alignItems: 'center'
                                                        }}
                                                        className="edit-shop-btn"
                                                    >
                                                        <Pencil size={12} color="var(--text-light)" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>

                                        <td data-label="Total Bill" style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'right', color: 'var(--text-light)', fontSize: '13px' }}>
                                            Rs. {invoice.totalBill.toLocaleString()}
                                        </td>
                                        <td data-label="Paid" style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'right', color: '#107c10', fontSize: '13px', fontWeight: '500' }}>
                                            <div>Rs. {paid.toLocaleString()}</div>
                                            {invoice.paymentHistory?.length > 0 && (
                                                <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '2px' }}>({invoice.paymentHistory.length} installments)</div>
                                            )}
                                        </td>
                                        <td data-label="Remaining" style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 'bold', color: '#c42b1c', fontSize: '13px' }}>
                                            Rs. {remaining.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px', verticalAlign: 'middle', textAlign: 'right' }}>
                                            <button
                                                className="installment-btn"
                                                style={{
                                                    background: '#0078d4',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 16px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                                onClick={() => openInstallmentModal(invoice)}
                                            >
                                                <Plus size={14} /> Installment
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RouteCard;
