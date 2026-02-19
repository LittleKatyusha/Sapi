import React from 'react';
import { X, Edit, Calendar, FileText, Tag, Ruler } from 'lucide-react';

const ItemFeedmilDetailModal = ({ 
  item, 
  onClose, 
  onEdit 
}) => {
  const handleEdit = () => {
    onEdit(item);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Detail Item Feedmil
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.name}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="ml-4">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <Tag className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Satuan */}
          {item.satuan_name && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Ruler className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Satuan</h4>
              </div>
              <p className="text-gray-700 ml-10 leading-relaxed">
                {item.satuan_name}
              </p>
            </div>
          )}

          {/* Deskripsi */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Deskripsi</h4>
            </div>
            <p className="text-gray-700 ml-10 leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          </div>

          {/* Metadata */}
          {(item.created_at || item.updated_at || item.pubid) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Informasi Tambahan</h4>
              </div>
              <div className="ml-10 space-y-2 text-sm text-gray-600">
                {item.created_at && (
                  <p>
                    <span className="font-medium">Dibuat:</span> {item.created_at}
                  </p>
                )}
                {item.updated_at && (
                  <p>
                    <span className="font-medium">Diperbarui:</span> {item.updated_at}
                  </p>
                )}
                {item.pubid && (
                  <p>
                    <span className="font-medium">ID:</span> 
                    <code className="ml-1 px-2 py-1 bg-gray-200 rounded text-xs font-mono">
                      {item.pubid}
                    </code>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Tutup
            </button>
            <button
              onClick={handleEdit}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Edit className="h-5 w-5" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemFeedmilDetailModal;
