import { type ApiError, type ApiSshKeyPairResponse } from '@lightdash/common';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { lightdashApi } from '../../../api';
import useToaster from '../../../hooks/toaster/useToaster';

export const useCreateSshKeyPair = (
    options: UseMutationOptions<ApiSshKeyPairResponse['results'], ApiError>,
) => {
    const { showToastApiError } = useToaster();
    const { t } = useTranslation();

    return useMutation<ApiSshKeyPairResponse['results'], ApiError>(
        async () =>
            lightdashApi({
                method: 'POST',
                url: '/ssh/key-pairs',
                body: undefined,
            }),
        {
            mutationKey: ['activeSshKeypair'],
            onError: ({ error }) => {
                showToastApiError({
                    title: t(
                        'components_project_connection_warehouse_form.ssh_hooks.tips.error',
                    ),
                    apiError: error,
                });
            },
            ...options,
        },
    );
};
