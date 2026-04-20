from pydantic import BaseModel


class CategoryResponse(BaseModel):
    name: str
    total: str
    count: int
    percentage: float


class SpendingSummaryResponse(BaseModel):
    total_spent: str
    transaction_count: int
    category_count: int
    categories: list[CategoryResponse]
    uncategorized_count: int
    uncategorized_percentage: float
    refund_total: str
    refund_count: int
