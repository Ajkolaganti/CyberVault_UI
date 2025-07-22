import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { accountsApi, testApiConnectivity } from '../../utils/api';
import { 
  Shield, 
  Database, 
  Globe, 
  Server, 
  Monitor, 
  Wifi,
  Eye,
  EyeOff,
  Cloud,
  Terminal
} from 'lucide-react';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    system_type: 'Windows',
    hostname: '',
    port: '',
    username: '',
    password: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Account Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        
        <Input
          label="Hostname/IP"
          value={formData.hostname}
          onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
          required
        />

        <Input
          label="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />

        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Create Account
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAccountModal;
