import { OrganizationMemberRole, type Space } from '@lightdash/common';
import {
    Avatar,
    Badge,
    Button,
    Group,
    MultiSelect,
    Stack,
    Text,
    Tooltip,
    type SelectItem,
} from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { forwardRef, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import { useOrganizationGroups } from '../../../hooks/useOrganizationGroups';
import { useOrganizationUsers } from '../../../hooks/useOrganizationUsers';
import { useProjectAccess } from '../../../hooks/useProjectAccess';
import {
    useAddGroupSpaceShareMutation,
    useAddSpaceShareMutation,
} from '../../../hooks/useSpaces';
import MantineIcon from '../MantineIcon';
import { useUserAccessOptions } from './ShareSpaceSelect';
import { getInitials, getUserNameOrEmail } from './Utils';

interface ShareSpaceAddUserProps {
    space: Space;
    projectUuid: string;
}

export const ShareSpaceAddUser: FC<ShareSpaceAddUserProps> = ({
    space,
    projectUuid,
}) => {
    const { t } = useTranslation();
    const UserAccessOptions = useUserAccessOptions();

    const [usersSelected, setUsersSelected] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const { data: projectAccess } = useProjectAccess(projectUuid);
    const { data: organizationUsers } = useOrganizationUsers();
    const { data: groups } = useOrganizationGroups({ includeMembers: 1 });
    const { mutateAsync: shareSpaceMutation } = useAddSpaceShareMutation(
        projectUuid,
        space.uuid,
    );
    const { mutateAsync: shareGroupSpaceMutation } =
        useAddGroupSpaceShareMutation(projectUuid, space.uuid);

    const userUuids: string[] = useMemo(() => {
        if (organizationUsers === undefined) return [];

        const projectUserUuids =
            projectAccess?.map((project) => project.userUuid) || [];

        const orgUserUuids = organizationUsers
            .filter((user) => user.role !== OrganizationMemberRole.MEMBER)
            .map((user) => user.userUuid);

        return [...new Set([...projectUserUuids, ...orgUserUuids])];
    }, [organizationUsers, projectAccess]);

    const UserItemComponent = useMemo(() => {
        return forwardRef<HTMLDivElement, SelectItem>((props, ref) => {
            if (props.group === 'Groups') {
                return (
                    <Group ref={ref} {...props} position={'apart'}>
                        <Group>
                            <Avatar size="md" radius="xl" color="blue">
                                <MantineIcon icon={IconUsers} />
                            </Avatar>
                            <Stack spacing="two">
                                <Text fw={500}>{props.label}</Text>
                            </Stack>
                        </Group>
                    </Group>
                );
            }

            const user = organizationUsers?.find(
                (userAccess) => userAccess.userUuid === props.value,
            );

            if (!user) return null;

            const spaceAccess = space.access.find(
                (access) => access.userUuid === user.userUuid,
            );
            const currentSpaceRoleTitle = spaceAccess
                ? UserAccessOptions.find(
                      (option) => option.value === spaceAccess.role,
                  )?.title ?? t('components_common_share_space_modal.no_access')
                : t('components_common_share_space_modal.no_access');

            const spaceRoleInheritanceInfo = t(
                'components_common_share_space_modal.space_role_inheritance_info',
                {
                    inheritedFrom: spaceAccess?.inheritedFrom,
                },
            );

            return (
                <Group ref={ref} {...props} position={'apart'}>
                    <Tooltip
                        label={spaceRoleInheritanceInfo}
                        position="top"
                        disabled={spaceAccess === undefined}
                    >
                        <Group>
                            <Avatar size="md" radius="xl" color="blue">
                                {getInitials(
                                    user.userUuid,
                                    user.firstName,
                                    user.lastName,
                                    user.email,
                                )}
                            </Avatar>
                            <Stack spacing="two">
                                {user.firstName || user.lastName ? (
                                    <>
                                        <Text fw={500}>
                                            {user.firstName} {user.lastName}
                                        </Text>

                                        <Text size={'xs'} color="dimmed">
                                            {user.email}
                                        </Text>
                                    </>
                                ) : (
                                    <Text fw={500}>{user.email}</Text>
                                )}
                            </Stack>
                        </Group>
                    </Tooltip>

                    <Badge size="xs" color="gray.6" radius="xs">
                        {currentSpaceRoleTitle}
                    </Badge>
                </Group>
            );
        });
    }, [organizationUsers, space.access, UserAccessOptions, t]);

    const data = useMemo(() => {
        const usersSet = userUuids.map((userUuid): SelectItem | null => {
            const user = organizationUsers?.find(
                (a) => a.userUuid === userUuid,
            );

            if (!user) return null;

            const hasDirectAccess = !!(space.access || []).find(
                (access) => access.userUuid === userUuid,
            )?.hasDirectAccess;

            if (hasDirectAccess) return null;

            return {
                value: userUuid,
                label: getUserNameOrEmail(
                    user.userUuid,
                    user.firstName,
                    user.lastName,
                    user.email,
                ),
                group: 'Users',
            };
        });

        const groupsSet = groups
            ?.filter(
                (group) =>
                    !space.groupsAccess.some(
                        (ga) => ga.groupUuid === group.uuid,
                    ),
            )
            .map((group): SelectItem | null => {
                return {
                    value: group.uuid,
                    label: group.name,
                    group: 'Groups',
                };
            });

        return [...usersSet, ...(groupsSet ?? [])].filter(
            (item): item is SelectItem => item !== null,
        );
    }, [
        organizationUsers,
        userUuids,
        space.access,
        groups,
        space.groupsAccess,
    ]);

    return (
        <Group>
            <MultiSelect
                style={{ flex: 1 }}
                withinPortal
                searchable
                clearable
                clearSearchOnChange
                clearSearchOnBlur
                placeholder={t(
                    'components_common_share_space_modal.select_users.placeholder',
                )}
                nothingFound={t(
                    'components_common_share_space_modal.select_users.nothingFound',
                )}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                value={usersSelected}
                onChange={setUsersSelected}
                data={data}
                itemComponent={UserItemComponent}
            />

            <Button
                disabled={usersSelected.length === 0}
                onClick={async () => {
                    for (const uuid of usersSelected) {
                        const selectedValue = data.find(
                            (item) => item.value === uuid,
                        );
                        if (selectedValue?.group === 'Users') {
                            await shareSpaceMutation([uuid, 'viewer']);
                        } else {
                            await shareGroupSpaceMutation([uuid, 'viewer']);
                        }
                    }
                    setUsersSelected([]);
                }}
            >
                {t('components_common_share_space_modal.share')}
            </Button>
        </Group>
    );
};
