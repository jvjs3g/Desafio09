import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export default  class addCustomersIdToOrders1601597413977 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'custumers_id',
          type: 'uuid',
          isNullable: true,
        }),
      );

      await queryRunner.createForeignKey(
        'orders',
        new TableForeignKey({
          name: 'ordercustumers',
          columnNames:['custumers_id'],
          referencedColumnNames: ['id'],
          referencedTableName:'custumers',
          onDelete: 'SET NULL',
        }),
      );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropForeignKey('orders', 'ordercustumers');

      await queryRunner.dropColumn('orders', 'customer_id');
    }

}
