"""add available column

Revision ID: f0caf70a08ce
Revises: 8de8eaab9683
Create Date: 2024-12-14 18:52:50.296346

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0caf70a08ce'
down_revision: Union[str, None] = '8de8eaab9683'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('material_stocks', sa.Column('available', sa.Float(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('material_stocks', 'available')
    # ### end Alembic commands ###
