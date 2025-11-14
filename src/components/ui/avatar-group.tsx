import { AlertCircle } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "./avatar"
import { cn } from "@/lib/utils"

interface User {
  id: number
  login: string
  avatar_url: string
}

interface AvatarGroupProps {
  users: User[]
  max?: number
  className?: string
}

export function AvatarGroup({ users, max = 5, className }: AvatarGroupProps) {
  const displayUsers = users.slice(0, max)
  const remaining = Math.max(0, users.length - max)

  if (users.length === 0) {
    return  <div className="flex items-center gap-1.5">
    <AlertCircle className="w-4 h-4 text-red-400" />
    <span className="text-sm text-red-400 font-medium">Sin asignar</span>
  </div>
  }

  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayUsers.map((user, index) => (
        <Avatar
          key={user.id}
          className="h-8 w-8 border-2 border-white"
          style={{ zIndex: displayUsers.length - index }}
          title={`@${user.login}`}
        >
          <AvatarImage src={user.avatar_url} alt={user.login} />
          <AvatarFallback>{user.login.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium"
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
