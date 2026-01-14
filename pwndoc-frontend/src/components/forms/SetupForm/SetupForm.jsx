import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { User, Lock, Mail, UserCircle } from 'lucide-react';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';
import Alert from '../../common/Alert/Alert';

const setupSchema = yup.object({
  username: yup
    .string()
    .required('El usuario es requerido')
    .min(3, 'Mínimo 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  firstname: yup.string().required('El nombre es requerido'),
  lastname: yup.string().required('El apellido es requerido'),
  email: yup
    .string()
    .email('Email inválido')
    .required('El email es requerido'),
  password: yup
    .string()
    .required('La contraseña es requerida')
    .min(8, 'Mínimo 8 caracteres'),
  confirmPassword: yup
    .string()
    .required('Confirme la contraseña')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
});

const SetupForm = ({ onSubmit, error, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(setupSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Configuración Inicial
        </h2>
        <p className="text-text-secondary">
          Cree el primer usuario administrador del sistema
        </p>
      </div>
      
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}
      
      <Input
        label="Usuario"
        icon={User}
        placeholder="ej: admin"
        error={errors.username?.message}
        {...register('username')}
        autoComplete="username"
        autoFocus
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre"
          icon={UserCircle}
          placeholder="Nombre"
          error={errors.firstname?.message}
          {...register('firstname')}
          autoComplete="given-name"
        />
        
        <Input
          label="Apellido"
          icon={UserCircle}
          placeholder="Apellido"
          error={errors.lastname?.message}
          {...register('lastname')}
          autoComplete="family-name"
        />
      </div>
      
      <Input
        label="Email"
        type="email"
        icon={Mail}
        placeholder="admin@example.com"
        error={errors.email?.message}
        {...register('email')}
        autoComplete="email"
      />
      
      <Input
        label="Contraseña"
        type="password"
        icon={Lock}
        placeholder="Mínimo 8 caracteres"
        error={errors.password?.message}
        {...register('password')}
        autoComplete="new-password"
      />
      
      <Input
        label="Confirmar Contraseña"
        type="password"
        icon={Lock}
        placeholder="Repita la contraseña"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
        autoComplete="new-password"
      />
      
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
      >
        Crear Usuario y Continuar
      </Button>
    </form>
  );
};

export default SetupForm;