import { ChartKind } from '@lightdash/common';
import {
    Box,
    Button,
    Group,
    Modal,
    Stack,
    Text,
    Textarea,
    TextInput,
    type ModalProps,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconArrowBack, IconChartBar } from '@tabler/icons-react';
import {
    useCallback,
    useEffect,
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import MantineIcon from '../../../components/common/MantineIcon';
import SaveToSpaceForm from '../../../components/common/modal/ChartCreateModal/SaveToSpaceForm';
import { saveToSpaceSchema } from '../../../components/common/modal/ChartCreateModal/types';
import { selectCompleteConfigByKind } from '../../../components/DataViz/store/selectors';
import {
    useCreateMutation as useSpaceCreateMutation,
    useSpaceSummaries,
} from '../../../hooks/useSpaces';
import { useCreateSqlChartMutation } from '../hooks/useSavedSqlCharts';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { EditorTabs, updateName } from '../store/sqlRunnerSlice';
import { SqlQueryBeforeSaveAlert } from './SqlQueryBeforeSaveAlert';

const saveChartFormSchema = z
    .object({
        name: z.string().min(1),
        description: z.string().nullable(),
    })
    .merge(saveToSpaceSchema);

type FormValues = z.infer<typeof saveChartFormSchema>;

type Props = Pick<ModalProps, 'opened' | 'onClose'>;

const SaveChartForm: FC<
    {
        setShowWarning: Dispatch<SetStateAction<boolean>>;
    } & Pick<Props, 'onClose'>
> = ({ setShowWarning, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const projectUuid = useAppSelector((state) => state.sqlRunner.projectUuid);
    const hasUnrunChanges = useAppSelector(
        (state) => state.sqlRunner.hasUnrunChanges,
    );

    const name = useAppSelector((state) => state.sqlRunner.name);
    const description = useAppSelector((state) => state.sqlRunner.description);

    const sql = useAppSelector((state) => state.sqlRunner.sql);
    const limit = useAppSelector((state) => state.sqlRunner.limit);

    const selectedChartType = useAppSelector(
        (state) => state.sqlRunner.selectedChartType,
    );

    const activeEditorTab = useAppSelector(
        (state) => state.sqlRunner.activeEditorTab,
    );

    const currentVizConfig = useAppSelector((state) =>
        selectCompleteConfigByKind(
            state,
            activeEditorTab === EditorTabs.SQL
                ? ChartKind.TABLE
                : selectedChartType,
        ),
    );

    // TODO: this sometimes runs `/api/v1/projects//spaces` request
    // because initial `projectUuid` is set to '' (empty string)
    // we should handle this by creating an impossible state
    // check first few lines inside `features/semanticViewer/store/selectors.ts`
    const {
        data: spaces = [],
        isLoading: isLoadingSpace,
        isSuccess: isSuccessSpace,
    } = useSpaceSummaries(projectUuid, true);

    const { mutateAsync: createSpace, isLoading: isCreatingSpace } =
        useSpaceCreateMutation(projectUuid);

    const form = useForm<FormValues>({
        initialValues: {
            name: '',
            description: null,

            spaceUuid: null,
            newSpaceName: null,
        },
        validate: zodResolver(saveChartFormSchema),
    });

    useEffect(() => {
        if (isSuccessSpace && spaces) {
            const values = {
                name,
                description,
                spaceUuid: spaces[0]?.uuid,
                newSpaceName: null,
            };
            form.setValues(values);
            form.resetDirty(values);
        }
        // form can't be a dependency because it will cause infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, description, spaces, isSuccessSpace]);

    const {
        mutateAsync: createSavedSqlChart,
        isLoading: isCreatingSavedSqlChart,
    } = useCreateSqlChartMutation(projectUuid);
    const handleOnSubmit = useCallback(async () => {
        if (spaces.length === 0) {
            return;
        }
        let newSpace = form.values.newSpaceName
            ? await createSpace({
                  name: form.values.newSpaceName,
                  access: [],
                  isPrivate: true,
              })
            : undefined;
        const spaceUuid =
            newSpace?.uuid || form.values.spaceUuid || spaces[0].uuid;

        if (currentVizConfig && sql) {
            try {
                await createSavedSqlChart({
                    name: form.values.name,
                    description: form.values.description || '',
                    sql,
                    limit,
                    config: currentVizConfig,
                    spaceUuid: spaceUuid,
                });

                dispatch(updateName(form.values.name));
                onClose();
            } catch (_) {
                // Error is handled in useCreateSqlChartMutation
            }
        }
    }, [
        spaces,
        form.values.newSpaceName,
        form.values.spaceUuid,
        form.values.name,
        form.values.description,
        createSpace,
        currentVizConfig,
        sql,
        createSavedSqlChart,
        limit,
        dispatch,
        onClose,
    ]);

    return (
        <form onSubmit={form.onSubmit(handleOnSubmit)}>
            <Stack p="md">
                <Stack spacing="xs">
                    <TextInput
                        label={t(
                            'features_sql_chart_modal.form.chart_name.label',
                        )}
                        placeholder={t(
                            'features_sql_chart_modal.form.chart_name.placeholder',
                        )}
                        required
                        {...form.getInputProps('name')}
                    />
                    <Textarea
                        label={t(
                            'features_sql_chart_modal.form.description.label',
                        )}
                        {...form.getInputProps('description')}
                        value={form.values.description ?? ''}
                    />
                </Stack>
                <SaveToSpaceForm
                    form={form}
                    spaces={spaces}
                    projectUuid={projectUuid}
                    isLoading={
                        isLoadingSpace ||
                        isCreatingSpace ||
                        isCreatingSavedSqlChart
                    }
                />
            </Stack>

            <Group
                position="right"
                w="100%"
                sx={(theme) => ({
                    borderTop: `1px solid ${theme.colors.gray[4]}`,
                    bottom: 0,
                    padding: theme.spacing.md,
                })}
            >
                <Button
                    onClick={onClose}
                    variant="outline"
                    disabled={isCreatingSavedSqlChart}
                >
                    {t('features_sql_chart_modal.cancel')}
                </Button>

                {hasUnrunChanges && (
                    <Button
                        leftIcon={<MantineIcon icon={IconArrowBack} />}
                        variant="outline"
                        onClick={() => setShowWarning(true)}
                    >
                        {t('features_sql_chart_modal.back')}
                    </Button>
                )}

                <Button
                    type="submit"
                    disabled={!form.values.name || !sql}
                    loading={isCreatingSavedSqlChart}
                >
                    {t('features_sql_chart_modal.save')}
                </Button>
            </Group>
        </form>
    );
};

export const SaveSqlChartModal: FC<Props> = ({ opened, onClose }) => {
    const { t } = useTranslation();
    const hasUnrunChanges = useAppSelector(
        (state) => state.sqlRunner.hasUnrunChanges,
    );
    const [showWarning, setShowWarning] = useState(hasUnrunChanges);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            keepMounted={false}
            title={
                <Group spacing="xs">
                    <MantineIcon icon={IconChartBar} size="lg" color="gray.7" />
                    <Text fw={500}>
                        {t('features_sql_chart_modal.save_chart')}
                    </Text>
                </Group>
            }
            styles={(theme) => ({
                header: { borderBottom: `1px solid ${theme.colors.gray[4]}` },
                body: { padding: 0 },
            })}
        >
            {showWarning ? (
                <Box>
                    <SqlQueryBeforeSaveAlert />
                    <Group
                        position="right"
                        w="100%"
                        sx={(theme) => ({
                            borderTop: `1px solid ${theme.colors.gray[4]}`,
                            bottom: 0,
                            padding: theme.spacing.md,
                        })}
                    >
                        <Button onClick={onClose} variant="outline">
                            {t('features_sql_chart_modal.cancel')}
                        </Button>

                        <Button onClick={() => setShowWarning(false)}>
                            {t('features_sql_chart_modal.next')}
                        </Button>
                    </Group>
                </Box>
            ) : (
                <SaveChartForm
                    setShowWarning={setShowWarning}
                    onClose={onClose}
                />
            )}
        </Modal>
    );
};
