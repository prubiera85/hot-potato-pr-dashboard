import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: number
  login: string
  avatar_url: string
}

interface UserSelectorProps {
  availableUsers: User[]
  selectedUserIds: number[]
  onToggleUser: (userId: number) => void
  className?: string
}

export function UserSelector({
  availableUsers,
  selectedUserIds,
  onToggleUser,
  className
}: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedCount = selectedUserIds.length

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-700">
          {selectedCount === 0
            ? "Seleccionar usuarios..."
            : `${selectedCount} seleccionado${selectedCount !== 1 ? "s" : ""}`}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {availableUsers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No hay usuarios disponibles</div>
          ) : (
            availableUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id)
              return (
                <div
                  key={user.id}
                  onClick={() => onToggleUser(user.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors",
                    isSelected && "bg-blue-50"
                  )}
                >
                  <div className="flex items-center justify-center w-4 h-4 border border-gray-300 rounded flex-shrink-0">
                    {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                  </div>
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-5 h-5 rounded-full flex-shrink-0"
                  />
                  <span className="text-gray-900">{user.login}</span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
