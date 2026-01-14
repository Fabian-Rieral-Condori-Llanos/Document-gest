import clsx from 'clsx';

const Card = ({ 
  children, 
  className,
  hover = false,
  padding = true,
  ...props 
}) => {
  return (
    <div
      className={clsx(
        'bg-bg-secondary rounded-lg border border-border-primary',
        'shadow-card transition-all duration-200',
        hover && 'hover:shadow-card-hover hover:border-border-secondary',
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;