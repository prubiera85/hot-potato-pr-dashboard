'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  Tags,
  TagsTrigger,
  TagsContent,
  TagsInput,
  TagsList,
  TagsEmpty,
  TagsGroup,
  TagsItem,
} from '@/components/ui/shadcn-io/tags';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface User {
  id: number;
  login: string;
  avatar_url: string;
}

interface UserSelectorProps {
  availableUsers: User[];
  selectedUserIds: number[];
  onToggleUser: (userId: number) => void;
  className?: string;
  placeholder?: string;
}

export function UserSelector({
  availableUsers,
  selectedUserIds,
  onToggleUser,
  className,
  placeholder = 'Seleccionar usuarios...',
}: UserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedUsers = availableUsers.filter((user) =>
    selectedUserIds.includes(user.id)
  );

  const filteredUsers = availableUsers.filter((user) =>
    user.login.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Tags
      open={open}
      onOpenChange={setOpen}
      className={className}
    >
      <TagsTrigger className="h-10 justify-start">
        {selectedUsers.length > 0 ? (
          <span className="text-sm px-2">
            {selectedUsers.length} seleccionado{selectedUsers.length !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground px-2">{placeholder}</span>
        )}
      </TagsTrigger>

      <TagsContent>
        <TagsInput
          placeholder="Buscar usuarios..."
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <TagsList>
          <TagsEmpty>No se encontraron usuarios.</TagsEmpty>
          <TagsGroup>
            {filteredUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              return (
                <TagsItem
                  key={user.id}
                  value={user.login}
                  onSelect={() => {
                    onToggleUser(user.id);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url} alt={user.login} />
                      <AvatarFallback className="text-xs">
                        {user.login.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.login}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-gray-900" />
                  )}
                </TagsItem>
              );
            })}
          </TagsGroup>
        </TagsList>
      </TagsContent>
    </Tags>
  );
}
