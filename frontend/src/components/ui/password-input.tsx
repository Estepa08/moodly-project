import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './input';
import { IconButton } from './icon-button';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showLabel?: string;
  hideLabel?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { showLabel = 'Show password', hideLabel = 'Hide password', className: _className, ...props },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input ref={ref} type={visible ? 'text' : 'password'} className="pr-12" {...props} />
        <IconButton
          size="icon-sm"
          variant="ghost"
          label={visible ? hideLabel : showLabel}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </IconButton>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
