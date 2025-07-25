import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera } from 'lucide-react';

const ProfilePhoto = ({ 
    photoUrl, 
    userName, 
    pubid, 
    size = 'md', 
    editable = false, 
    onPhotoUpdate,
    onPhotoError 
}) => {
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState(photoUrl);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    // Size configurations
    const sizeConfig = {
        xs: { container: 'w-6 h-6', icon: 12, text: 'text-xs' },
        sm: { container: 'w-8 h-8', icon: 16, text: 'text-sm' },
        md: { container: 'w-12 h-12', icon: 20, text: 'text-base' },
        lg: { container: 'w-16 h-16', icon: 24, text: 'text-lg' },
        xl: { container: 'w-24 h-24', icon: 32, text: 'text-xl' },
        '2xl': { container: 'w-32 h-32', icon: 40, text: 'text-2xl' }
    };

    const config = sizeConfig[size] || sizeConfig.md;

    useEffect(() => {
        setCurrentPhotoUrl(photoUrl);
    }, [photoUrl]);

    // Handle file selection
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                if (onPhotoError) {
                    onPhotoError('File harus berupa gambar');
                }
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                if (onPhotoError) {
                    onPhotoError('Ukuran file maksimal 5MB');
                }
                return;
            }

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target.result);
                setShowUploadModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle photo upload
    const handleUpload = async (file) => {
        if (!file || !onPhotoUpdate) return;

        setIsUploading(true);
        try {
            const result = await onPhotoUpdate(pubid, file);
            if (result.success) {
                setCurrentPhotoUrl(previewUrl);
                setShowUploadModal(false);
                setPreviewUrl(null);
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                if (onPhotoError) {
                    onPhotoError(result.message || 'Gagal mengupload foto');
                }
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            if (onPhotoError) {
                onPhotoError('Terjadi kesalahan saat mengupload foto');
            }
        } finally {
            setIsUploading(false);
        }
    };

    // Handle upload confirmation
    const confirmUpload = () => {
        const file = fileInputRef.current?.files[0];
        if (file) {
            handleUpload(file);
        }
    };

    // Cancel upload
    const cancelUpload = () => {
        setShowUploadModal(false);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Get initials from name
    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <div className="relative inline-block">
            {/* Photo Display */}
            <div className={`${config.container} relative rounded-full overflow-hidden bg-gray-200 flex items-center justify-center`}>
                {currentPhotoUrl ? (
                    <img
                        src={currentPhotoUrl}
                        alt={userName || 'Profile'}
                        className="w-full h-full object-cover"
                        onError={() => setCurrentPhotoUrl(null)}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <span className={`font-semibold text-white ${config.text}`}>
                            {getInitials(userName)}
                        </span>
                    </div>
                )}
                
                {/* Upload Button Overlay */}
                {editable && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                         onClick={() => fileInputRef.current?.click()}>
                        <Camera size={config.icon} className="text-white" />
                    </div>
                )}
            </div>

            {/* Hidden File Input */}
            {editable && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                Upload Foto Profil
                            </h3>
                        </div>
                        
                        <div className="px-6 py-4">
                            {previewUrl && (
                                <div className="flex justify-center mb-4">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-32 h-32 object-cover rounded-full border-4 border-gray-200"
                                    />
                                </div>
                            )}
                            
                            <p className="text-sm text-gray-600 text-center">
                                Pastikan foto yang dipilih sudah sesuai
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={cancelUpload}
                                disabled={isUploading}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirmUpload}
                                disabled={isUploading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} />
                                        Upload
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePhoto;