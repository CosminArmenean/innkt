import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    accountType: 'individual', // 'individual' or 'joint'
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  const [persons, setPersons] = useState<Person[]>([
    { id: '1', firstName: '', lastName: '', email: '' }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePersonChange = (id: string, field: keyof Person, value: string) => {
    setPersons(prev => prev.map(person => 
      person.id === id ? { ...person, [field]: value } : person
    ));
  };

  const addPerson = () => {
    if (persons.length < 2) {
      const newId = (persons.length + 1).toString();
      setPersons(prev => [...prev, { id: newId, firstName: '', lastName: '', email: '' }]);
    }
  };

  const removePerson = (id: string) => {
    if (persons.length > 1) {
      setPersons(prev => prev.filter(person => person.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implement actual registration logic with Officer microservice
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-innkt-primary rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">I</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your INNKT account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/login"
            className="font-medium text-innkt-primary hover:text-innkt-dark"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none">
                  <input
                    type="radio"
                    name="accountType"
                    value="individual"
                    checked={formData.accountType === 'individual'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">Individual Account</span>
                      <span className="mt-1 flex items-center text-sm text-gray-500">Single person account</span>
                    </div>
                  </div>
                  <div className={`h-5 w-5 text-innkt-primary ${formData.accountType === 'individual' ? 'opacity-100' : 'opacity-0'}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </label>

                <label className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none">
                  <input
                    type="radio"
                    name="accountType"
                    value="joint"
                    checked={formData.accountType === 'joint'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">Joint Account</span>
                      <span className="mt-1 flex items-center text-sm text-gray-500">Shared account for two people</span>
                    </div>
                  </div>
                  <div className={`h-5 w-5 text-innkt-primary ${formData.accountType === 'joint' ? 'opacity-100' : 'opacity-0'}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </label>
              </div>
            </div>

            {/* Person Information */}
            {persons.map((person, index) => (
              <div key={person.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {formData.accountType === 'joint' ? `Person ${index + 1}` : 'Your Information'}
                  </h3>
                  {formData.accountType === 'joint' && persons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerson(person.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={person.firstName}
                      onChange={(e) => handlePersonChange(person.id, 'firstName', e.target.value)}
                      className="input-field mt-1"
                      placeholder="First name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={person.lastName}
                      onChange={(e) => handlePersonChange(person.id, 'lastName', e.target.value)}
                      className="input-field mt-1"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={person.email}
                    onChange={(e) => handlePersonChange(person.id, 'email', e.target.value)}
                    className="input-field mt-1"
                    placeholder="Email address"
                    required
                  />
                </div>
              </div>
            ))}

            {/* Add Person Button for Joint Accounts */}
            {formData.accountType === 'joint' && persons.length < 2 && (
              <button
                type="button"
                onClick={addPerson}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-innkt-primary hover:text-innkt-primary transition-colors duration-200"
              >
                + Add Second Person
              </button>
            )}

            {/* Account Credentials */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Credentials</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="Create a strong password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field mt-1"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="h-4 w-4 text-innkt-primary focus:ring-innkt-primary border-gray-300 rounded"
                required
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="#" className="text-innkt-primary hover:text-innkt-dark">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-innkt-primary hover:text-innkt-dark">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;


