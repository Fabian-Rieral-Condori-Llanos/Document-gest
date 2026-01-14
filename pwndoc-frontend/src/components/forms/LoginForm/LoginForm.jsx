import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { User, Lock } from 'lucide-react';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';
import Alert from '../../common/Alert/Alert';

const loginSchema = yup.object({
  username: yup.string().required('El usuario es requerido'),
  password: yup.string().required('La contraseña es requerida'),
});

const LoginForm = ({ onSubmit, error, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}
      
      <Input
        label="Usuario"
        icon={User}
        placeholder="Ingrese su usuario"
        error={errors.username?.message}
        {...register('username')}
        autoComplete="username"
        autoFocus
      />
      
      <Input
        label="Contraseña"
        type="password"
        icon={Lock}
        placeholder="Ingrese su contraseña"
        error={errors.password?.message}
        {...register('password')}
        autoComplete="current-password"
      />
      
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
      >
        Iniciar Sesión
      </Button>
    </form>
  );
};

export default LoginForm;