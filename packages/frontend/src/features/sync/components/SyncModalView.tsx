import { SchedulerFormat } from '@lightdash/common';
import {
    ActionIcon,
    Anchor,
    Button,
    Card,
    Flex,
    Group,
    Menu,
    Popover,
    Stack,
    Text,
} from '@mantine/core';
import {
    IconDots,
    IconInfoCircle,
    IconPencil,
    IconTrash,
} from '@tabler/icons-react';
import cronstrue from 'cronstrue';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';

import MantineIcon from '../../../components/common/MantineIcon';
import { useChartSchedulers } from '../../../features/scheduler/hooks/useChartSchedulers';
import { SyncModalAction, useSyncModal } from '../providers/SyncModalProvider';

export const SyncModalView: FC<{ chartUuid: string }> = ({ chartUuid }) => {
    const { t } = useTranslation();
    const { data } = useChartSchedulers(chartUuid);
    const { setAction, setCurrentSchedulerUuid } = useSyncModal();
    const googleSheetsSyncs = data?.filter(
        ({ format }) => format === SchedulerFormat.GSHEETS,
    );

    return (
        <>
            <Stack spacing="lg" mih={300}>
                {googleSheetsSyncs && googleSheetsSyncs.length ? (
                    <Stack pt="md" pb="xl">
                        {googleSheetsSyncs.map((sync) => (
                            <Card
                                key={sync.schedulerUuid}
                                withBorder
                                pos="relative"
                                p="xs"
                            >
                                <Stack spacing="xs">
                                    <Text fz="sm" fw={500}>
                                        {sync.name}
                                    </Text>

                                    <Flex align="center">
                                        <Text span size="xs" color="gray.6">
                                            {cronstrue.toString(sync.cron, {
                                                verbose: true,
                                                throwExceptionOnParseError:
                                                    false,
                                            })}
                                        </Text>
                                    </Flex>
                                </Stack>

                                <Menu
                                    shadow="md"
                                    withinPortal
                                    withArrow
                                    offset={{
                                        crossAxis: -4,
                                        mainAxis: -4,
                                    }}
                                    position="bottom-end"
                                >
                                    <Menu.Target>
                                        <ActionIcon
                                            pos="absolute"
                                            top={0}
                                            right={0}
                                        >
                                            <MantineIcon icon={IconDots} />
                                        </ActionIcon>
                                    </Menu.Target>

                                    <Menu.Dropdown>
                                        <Menu.Item
                                            icon={
                                                <MantineIcon
                                                    icon={IconPencil}
                                                />
                                            }
                                            onClick={() => {
                                                setAction(SyncModalAction.EDIT);
                                                setCurrentSchedulerUuid(
                                                    sync.schedulerUuid,
                                                );
                                            }}
                                        >
                                            {t('features_sync.modal_view.edit')}
                                        </Menu.Item>
                                        <Menu.Item
                                            icon={
                                                <MantineIcon
                                                    color="red"
                                                    icon={IconTrash}
                                                />
                                            }
                                            onClick={() => {
                                                setAction(
                                                    SyncModalAction.DELETE,
                                                );
                                                setCurrentSchedulerUuid(
                                                    sync.schedulerUuid,
                                                );
                                            }}
                                        >
                                            {t(
                                                'features_sync.modal_view.delete',
                                            )}
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Card>
                        ))}
                    </Stack>
                ) : (
                    <Group
                        position="center"
                        ta="center"
                        spacing="xs"
                        my="sm"
                        pt="md"
                    >
                        <Text fz="sm" fw={450} c="gray.7">
                            {t(
                                'features_sync.modal_view.tip_create_new.part_1',
                            )}
                        </Text>
                        <Text fz="xs" fw={400} c="gray.6">
                            {t(
                                'features_sync.modal_view.tip_create_new.part_2',
                            )}
                        </Text>
                    </Group>
                )}
            </Stack>
            <Flex
                sx={(theme) => ({
                    position: 'sticky',
                    backgroundColor: 'white',
                    borderTop: `1px solid ${theme.colors.gray[4]}`,
                    bottom: 0,
                    zIndex: 2,
                    margin: -16, // TODO: is there a way to negate theme values?
                    padding: theme.spacing.md,
                })}
                justify="space-between"
                align="center"
            >
                <Popover withinPortal width={150} withArrow>
                    <Popover.Target>
                        <Button
                            size="xs"
                            fz={9}
                            variant="subtle"
                            color="gray"
                            leftIcon={
                                <MantineIcon size={12} icon={IconInfoCircle} />
                            }
                        >
                            {t('features_sync.modal_view.user_data_policy')}
                        </Button>
                    </Popover.Target>

                    <Popover.Dropdown>
                        <Text fz={9}>
                            {t(
                                'features_sync.modal_view.tip_user_data_policy.part_1',
                            )}{' '}
                            <Anchor
                                target="_blank"
                                href="https://developers.google.com/terms/api-services-user-data-policy"
                            >
                                {t(
                                    'features_sync.modal_view.tip_user_data_policy.part_2',
                                )}
                            </Anchor>
                            {t(
                                'features_sync.modal_view.tip_user_data_policy.part_3',
                            )}
                        </Text>
                    </Popover.Dropdown>
                </Popover>

                <Button
                    size="sm"
                    display="block"
                    ml="auto"
                    onClick={() => setAction(SyncModalAction.CREATE)}
                >
                    {t('features_sync.modal_view.create_new_sync')}
                </Button>
            </Flex>
        </>
    );
};
