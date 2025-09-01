
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "../ui/input"

interface ComboboxProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
    disabled?: boolean;
}

export function Combobox({ options, value, onChange, placeholder, className, disabled }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }

  // The main input element for the combobox
  const renderInput = () => (
    <Input
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      className="w-full"
      disabled={disabled}
    />
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
         <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label || value
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1
          return 0
        }}>
          <CommandInput 
            placeholder={placeholder}
            value={value}
            onValueChange={onChange}
           />
          <CommandList>
            <CommandEmpty>Tidak ada hasil. Ketik untuk membuat yang baru.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Compare against label
                  onSelect={(currentValue) => {
                    const selectedOption = options.find(opt => opt.label.toLowerCase() === currentValue.toLowerCase());
                    onChange(selectedOption ? selectedOption.value : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
