import {
    Button,
    Group,
    Kbd,
    MantineProvider,
    Text,
    Tooltip,
    type MantineSize,
} from '@mantine/core';
import { useHotkeys, useOs } from '@mantine/hooks';
import { IconPlayerPlay } from '@tabler/icons-react';
import { memo, useCallback, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import { useExplorerContext } from '../providers/ExplorerProvider';
import { useTracking } from '../providers/TrackingProvider';
import { EventName } from '../types/Events';
import MantineIcon from './common/MantineIcon';
import LimitButton from './LimitButton';

export const RefreshButton: FC<{ size?: MantineSize }> = memo(({ size }) => {
    const os = useOs();
    const limit = useExplorerContext(
        (context) => context.state.unsavedChartVersion.metricQuery.limit,
    );
    const setRowLimit = useExplorerContext(
        (context) => context.actions.setRowLimit,
    );
    const isValidQuery = useExplorerContext(
        (context) => context.state.isValidQuery,
    );
    const isLoading = useExplorerContext(
        (context) => context.queryResults.isLoading,
    );
    const fetchResults = useExplorerContext(
        (context) => context.actions.fetchResults,
    );
    const { t } = useTranslation();

    const canRunQuery = isValidQuery;

    const { track } = useTracking();

    const onClick = useCallback(() => {
        if (canRunQuery) {
            fetchResults();
            track({ name: EventName.RUN_QUERY_BUTTON_CLICKED });
        }
    }, [fetchResults, track, canRunQuery]);

    useHotkeys([['mod + enter', onClick, { preventDefault: true }]]);

    return (
        <Button.Group>
            <Tooltip
                label={
                    <MantineProvider inherit theme={{ colorScheme: 'dark' }}>
                        <Group spacing="xxs">
                            <Kbd fw={600}>
                                {os === 'macos' || os === 'ios' ? '⌘' : 'ctrl'}
                            </Kbd>

                            <Text fw={600}>+</Text>

                            <Kbd fw={600}>Enter</Kbd>
                        </Group>
                    </MantineProvider>
                }
                position="bottom"
                withArrow
                withinPortal
                disabled={isLoading || !isValidQuery}
            >
                <Button
                    pr="xxs"
                    size={size}
                    disabled={!isValidQuery}
                    leftIcon={<MantineIcon icon={IconPlayerPlay} />}
                    loading={isLoading}
                    onClick={onClick}
                    sx={{ flex: 1 }}
                >
                    {t('components_refresh_buttom.run_query')} ({limit})
                </Button>
            </Tooltip>

            <LimitButton
                disabled={!isValidQuery}
                size={size}
                limit={limit}
                onLimitChange={setRowLimit}
            />
        </Button.Group>
    );
});
