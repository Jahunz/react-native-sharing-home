import { Button, ButtonText } from "@/components/ui/button";

interface StyledButtonProps {
    buttonText: string;
    onPress: () => void;
    disabled?: boolean;
    buttonClassName?: string;
    size?: "sm" | "md" | "lg";
    variant?: "solid" | "outline";
    action?: "primary" | "secondary";
    textClassName?: string;
}
export default function StyledButton({
    buttonText,
    onPress,
    disabled = false,
    buttonClassName,
    size = "lg",
    variant = "solid",
    action = "primary",
    textClassName,
}: StyledButtonProps) {
    return (
        <Button
            onPress={onPress}
            disabled={disabled}
            className={buttonClassName}
            size={size}
            variant={variant}
            action={action}
        >
            <ButtonText className={textClassName}>{buttonText}</ButtonText>
        </Button>
    );
}
