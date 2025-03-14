import { subject } from '@casl/ability';
import {
    OrganizationMemberRole,
    ProjectMemberRole,
    validateEmail,
    type CreateProjectMember,
    type InviteLink,
} from '@lightdash/common';

import { Button, Group, Modal, Select, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUserPlus } from '@tabler/icons-react';
import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateInviteLinkMutation } from '../../hooks/useInviteLink';
import { useOrganizationUsers } from '../../hooks/useOrganizationUsers';
import { useCreateProjectAccessMutation } from '../../hooks/useProjectAccess';
import useApp from '../../providers/App/useApp';
import { TrackPage } from '../../providers/Tracking/TrackingProvider';
import useTracking from '../../providers/Tracking/useTracking';
import {
    CategoryName,
    EventName,
    PageName,
    PageType,
} from '../../types/Events';
import InviteSuccess from '../UserSettings/UsersAndGroupsPanel/InviteSuccess';
import MantineIcon from '../common/MantineIcon';

interface Props {
    projectUuid: string;
    onClose: () => void;
}

const CreateProjectAccessModal: FC<Props> = ({ projectUuid, onClose }) => {
    const { track } = useTracking();
    const { user } = useApp();

    const { data: organizationUsers } = useOrganizationUsers();
    const { mutateAsync: createMutation, isLoading } =
        useCreateProjectAccessMutation(projectUuid);
    const { t } = useTranslation();

    const {
        mutateAsync: inviteMutation,
        isLoading: isInvitationLoading,
        reset,
    } = useCreateInviteLinkMutation();

    const form = useForm<Pick<CreateProjectMember, 'email' | 'role'>>({
        initialValues: {
            email: '',
            role: ProjectMemberRole.VIEWER,
        },
    });

    const [addNewMember, setAddNewMember] = useState<boolean>(false);
    const [inviteLink, setInviteLink] = useState<InviteLink | undefined>();
    const [emailOptions, setEmailOptions] = useState<string[]>([]);

    useEffect(() => {
        if (organizationUsers) {
            setEmailOptions(organizationUsers.map(({ email }) => email));
        }
    }, [organizationUsers]);

    const handleSubmit = async (
        formData: Pick<CreateProjectMember, 'email' | 'role'>,
    ) => {
        track({
            name: EventName.CREATE_PROJECT_ACCESS_BUTTON_CLICKED,
        });
        setInviteLink(undefined);

        if (addNewMember) {
            const data = await inviteMutation({
                email: formData.email,
                role: OrganizationMemberRole.MEMBER,
            });
            await createMutation({
                ...formData,
                sendEmail: false,
            });
            setAddNewMember(false);
            setInviteLink(data);
            reset();
            form.reset();
        } else {
            await createMutation({
                ...formData,
                sendEmail: true,
            });
            form.reset();
        }
    };

    const userCanInviteUsersToOrganization = user.data?.ability.can(
        'manage',
        subject('Organization', {
            organizationUuid: user.data?.organizationUuid,
            projectUuid,
        }),
    );

    return (
        <Modal
            opened
            onClose={onClose}
            keepMounted={false}
            title={
                <Group spacing="xs">
                    <MantineIcon size="lg" icon={IconUserPlus} />
                    <Title order={4}>
                        {t('components_project_access_create_modal.title')}
                    </Title>
                </Group>
            }
            size="lg"
        >
            <TrackPage
                name={PageName.PROJECT_ADD_USER}
                type={PageType.MODAL}
                category={CategoryName.SETTINGS}
            >
                <form
                    name="add_user_to_project"
                    onSubmit={form.onSubmit(
                        (values: Pick<CreateProjectMember, 'email' | 'role'>) =>
                            handleSubmit(values),
                    )}
                >
                    <Group align="flex-end" spacing="xs">
                        <Select
                            name={'email'}
                            withinPortal
                            label={t(
                                'components_project_access_create_modal.select_email.label',
                            )}
                            placeholder={t(
                                'components_project_access_create_modal.select_email.placeholder',
                            )}
                            nothingFound={t(
                                'components_project_access_create_modal.select_email.nothingFound',
                            )}
                            searchable
                            creatable
                            required
                            disabled={isLoading}
                            getCreateLabel={(query) => {
                                if (validateEmail(query)) {
                                    return (
                                        <span style={{ wordBreak: 'keep-all' }}>
                                            {t(
                                                'components_project_access_create_modal.select_email.create_label',
                                            )}
                                        </span>
                                    );
                                }
                                return null;
                            }}
                            onCreate={(query) => {
                                if (
                                    validateEmail(query) &&
                                    userCanInviteUsersToOrganization
                                ) {
                                    setAddNewMember(true);
                                    setEmailOptions((prevState) => [
                                        ...prevState,
                                        query,
                                    ]);
                                    return query;
                                }
                            }}
                            data={emailOptions}
                            {...form.getInputProps('email')}
                            sx={{ flexGrow: 1 }}
                        />
                        <Select
                            data={Object.values(ProjectMemberRole).map(
                                (orgMemberRole) => ({
                                    value: orgMemberRole,
                                    label: orgMemberRole.replace('_', ' '),
                                }),
                            )}
                            disabled={isLoading}
                            required
                            placeholder={t(
                                'components_project_access_create_modal.select_role.placeholder',
                            )}
                            dropdownPosition="bottom"
                            withinPortal
                            {...form.getInputProps('role')}
                        />
                        <Button
                            disabled={isLoading || isInvitationLoading}
                            type="submit"
                        >
                            {t(
                                'components_project_access_create_modal.give_access',
                            )}
                        </Button>
                    </Group>
                </form>

                {inviteLink && (
                    <InviteSuccess invite={inviteLink} hasMarginTop />
                )}
            </TrackPage>
        </Modal>
    );
};

export default CreateProjectAccessModal;
