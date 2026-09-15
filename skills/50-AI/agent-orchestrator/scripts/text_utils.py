"""Shared pure text helpers for agent-orchestrator scripts."""


def truncate_text(text: str, max_len: int, suffix: str = "…") -> str:
    """Truncate *text* to at most *max_len* chars, appending *suffix* when cut."""
    if not isinstance(text, str):
        raise TypeError(f"text must be str, got {type(text).__name__}")  # noqa: TRY003
    if max_len < 1:
        raise ValueError(f"max_len must be >= 1, got {max_len}")  # noqa: TRY003
    if len(suffix) >= max_len:
        raise ValueError(f"suffix length ({len(suffix)}) must be < max_len ({max_len})")  # noqa: TRY003
    if len(text) <= max_len:
        return text
    return text[: max_len - len(suffix)] + suffix
