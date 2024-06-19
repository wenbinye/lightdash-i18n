import {
    Anchor,
    Tooltip,
    type AnchorProps,
    type TooltipProps,
} from '@mantine/core';
import { IconHelpCircle } from '@tabler/icons-react';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';

import MantineIcon, { type MantineIconProps } from './common/MantineIcon';

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> &
    Partial<AnchorProps> & {
        iconProps?: Partial<MantineIconProps>;
        tooltipProps?: Partial<TooltipProps>;
    };

const DocumentationHelpButton: FC<Props> = ({
    iconProps,
    tooltipProps,
    ...anchorProps
}) => {
    const { t } = useTranslation();

    return (
        <Tooltip
            withinPortal
            label={t('components_documentation_help_button.tooltip.label')}
            position="top"
            maw={350}
            {...tooltipProps}
        >
            <Anchor
                role="button"
                target="_blank"
                rel="noreferrer"
                color="dimmed"
                {...anchorProps}
            >
                <MantineIcon
                    icon={IconHelpCircle}
                    size="md"
                    display="inline"
                    {...iconProps}
                />
            </Anchor>
        </Tooltip>
    );
};

export default DocumentationHelpButton;
