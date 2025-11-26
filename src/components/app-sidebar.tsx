import { LayoutGrid, User, Users, HelpCircle, Shield } from 'lucide-react';
import { NavUser } from './nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from './ui/sidebar';
import { useHasPermission } from '@/hooks/usePermissions';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentView: string;
  onViewChange: (view: string) => void;
  onOpenConfig: () => void;
  onOpenGifModal: () => void;
  onOpenHelp: () => void;
  onOpenRoleManagement: () => void;
}

export function AppSidebar({ currentView, onViewChange, onOpenConfig, onOpenGifModal, onOpenHelp, onOpenRoleManagement, ...props }: AppSidebarProps) {
  const canManageRoles = useHasPermission('canManageRoles');

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      {/* Logo y título en el header */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <img
            src="/hot-potato-logo.png"
            alt="Hot Potato Logo"
            className="h-8 w-8 min-w-8 object-contain transition-transform duration-300 hover:animate-wiggle cursor-pointer"
            onClick={onOpenGifModal}
          />
          <div className="flex-1 group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-bold">
              <span className="text-red-600">Hot</span>Potato
            </h1>
            <p className="text-xs text-muted-foreground">PR Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Navegación principal */}
      <SidebarContent>
        {/* Sección Pull Requests */}
        <SidebarGroup>
          <SidebarGroupLabel>Pull Requests</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Todas las PRs"
                  isActive={currentView === 'all'}
                  onClick={() => onViewChange('all')}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>Todas las PRs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Mis PRs"
                  isActive={currentView === 'my-prs'}
                  onClick={() => onViewChange('my-prs')}
                >
                  <User className="h-4 w-4" />
                  <span>Mis PRs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sección Equipo */}
        <SidebarGroup>
          <SidebarGroupLabel>Equipo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Vista por usuario"
                  isActive={currentView === 'team'}
                  onClick={() => onViewChange('team')}
                >
                  <Users className="h-4 w-4" />
                  <span>Vista por Usuario</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* NavUser en el footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onOpenHelp}
              tooltip="Leyenda de colores"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Leyenda de colores</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {canManageRoles && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onOpenRoleManagement}
                tooltip="Gestión de roles"
              >
                <Shield className="h-4 w-4 text-purple-600" />
                <span>Gestión de roles</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
        <NavUser onOpenConfig={onOpenConfig} />
      </SidebarFooter>

      {/* Rail para redimensionar */}
      <SidebarRail />
    </Sidebar>
  );
}
