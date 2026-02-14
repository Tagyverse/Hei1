import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Eye, EyeOff, GripVertical } from 'lucide-react';
import { ref as dbRef, push, set, get, remove, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { TryOnModel } from '../../types';
import ImageUpload from '../ImageUpload';

export default function TryOnModelManager() {
  const [models, setModels] = useState<TryOnModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    image_url: '',
    is_active: true,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const modelsRef = dbRef(db, 'try_on_models');
      const snapshot = await get(modelsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const modelsList = Object.entries(data).map(([id, modelData]: [string, any]) => ({
          id,
          ...modelData
        })) as TryOnModel[];

        modelsList.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setModels(modelsList);
      } else {
        setModels([]);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      setMessage({ type: 'error', text: 'Failed to load models' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddModel = async () => {
    if (!newModel.name.trim() || !newModel.image_url) {
      setMessage({ type: 'error', text: 'Please provide name and image' });
      return;
    }

    try {
      const maxOrder = models.length > 0
        ? Math.max(...models.map(m => m.order_index || 0))
        : 0;

      const modelsRef = dbRef(db, 'try_on_models');
      const newModelRef = push(modelsRef);

      await set(newModelRef, {
        name: newModel.name.trim(),
        image_url: newModel.image_url,
        is_active: newModel.is_active,
        order_index: maxOrder + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setMessage({ type: 'success', text: 'Model added successfully' });
      setNewModel({ name: '', image_url: '', is_active: true });
      setShowAddForm(false);
      loadModels();
    } catch (error) {
      console.error('Error adding model:', error);
      setMessage({ type: 'error', text: 'Failed to add model' });
    }
  };

  const handleToggleActive = async (model: TryOnModel) => {
    try {
      const modelRef = dbRef(db, `try_on_models/${model.id}`);
      await update(modelRef, {
        is_active: !model.is_active,
        updated_at: new Date().toISOString(),
      });
      setMessage({ type: 'success', text: 'Model updated successfully' });
      loadModels();
    } catch (error) {
      console.error('Error updating model:', error);
      setMessage({ type: 'error', text: 'Failed to update model' });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      const modelRef = dbRef(db, `try_on_models/${modelId}`);
      await remove(modelRef);
      setMessage({ type: 'success', text: 'Model deleted successfully' });
      loadModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      setMessage({ type: 'error', text: 'Failed to delete model' });
    }
  };

  const handleReorder = async (modelId: string, direction: 'up' | 'down') => {
    const currentIndex = models.findIndex(m => m.id === modelId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === models.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newModels = [...models];
    [newModels[currentIndex], newModels[newIndex]] = [newModels[newIndex], newModels[currentIndex]];

    try {
      await Promise.all(
        newModels.map((model, index) => {
          const modelRef = dbRef(db, `try_on_models/${model.id}`);
          return update(modelRef, {
            order_index: index,
            updated_at: new Date().toISOString(),
          });
        })
      );
      setModels(newModels);
      setMessage({ type: 'success', text: 'Order updated successfully' });
    } catch (error) {
      console.error('Error updating order:', error);
      setMessage({ type: 'error', text: 'Failed to update order' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Try-On Models</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAddForm ? 'Cancel' : 'Add Model'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Add New Model</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Name
            </label>
            <input
              type="text"
              value={newModel.name}
              onChange={(e) => setNewModel(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Model 1, Studio Shot, Lifestyle Photo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <ImageUpload
            label="Model Image"
            value={newModel.image_url}
            onChange={(url) => setNewModel(prev => ({ ...prev, image_url: url }))}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={newModel.is_active}
              onChange={(e) => setNewModel(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active (visible to users)
            </label>
          </div>

          <button
            onClick={handleAddModel}
            disabled={!newModel.name.trim() || !newModel.image_url}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Add Model
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {models.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No models added yet. Add your first model to get started.</p>
          </div>
        ) : (
          models.map((model, index) => (
            <div
              key={model.id}
              className="bg-white p-4 rounded-lg shadow-md flex items-center gap-4"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleReorder(model.id, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => handleReorder(model.id, 'down')}
                  disabled={index === models.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <img
                src={model.image_url}
                alt={model.name}
                className="w-24 h-24 object-cover rounded-lg"
              />

              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{model.name}</h4>
                <p className="text-sm text-gray-500">
                  {model.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(model)}
                  className={`p-2 rounded-lg transition-colors ${
                    model.is_active
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={model.is_active ? 'Deactivate' : 'Activate'}
                >
                  {model.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => handleDeleteModel(model.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
