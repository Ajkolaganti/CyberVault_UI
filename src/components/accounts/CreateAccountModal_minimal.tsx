import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg">
        <h2>Create Account</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Success</button>
      </div>
    </div>
  );
};

export default CreateAccountModal;
