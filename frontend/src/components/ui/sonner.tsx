import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-slate-500',
          actionButton:
            'group-[.toast]:bg-[#1a2b5c] group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500',
          error:
            'group-[.toaster]:text-red-700 group-[.toaster]:border-red-200 group-[.toaster]:bg-red-50/80',
          success:
            'group-[.toaster]:text-emerald-800 group-[.toaster]:border-emerald-200 group-[.toaster]:bg-emerald-50/80',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
