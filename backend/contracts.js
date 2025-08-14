import crypto from 'crypto';

export class ContractValidator {
  constructor() {
    this.contracts = new Map();
    this.registeredActions = new Set();
    this.setupDefaultContracts();
  }

  setupDefaultContracts() {
    // Register default contract types
    this.registerContract('order_created', this.validateOrderCreated.bind(this));
    this.registerContract('order_approved', this.validateOrderApproved.bind(this));
    this.registerContract('shipment_created', this.validateShipmentCreated.bind(this));
    this.registerContract('shipment_delivered', this.validateShipmentDelivered.bind(this));
    this.registerContract('payment_processed', this.validatePaymentProcessed.bind(this));
    this.registerContract('inventory_adjusted', this.validateInventoryAdjusted.bind(this));
    this.registerContract('supplier_registered', this.validateSupplierRegistered.bind(this));
    this.registerContract('mining_reward', this.validateMiningReward.bind(this));
    this.registerContract('transfer', this.validateTransfer.bind(this));
  }

  registerContract(action, validator) {
    this.contracts.set(action, validator);
    this.registeredActions.add(action);
    console.log(`Contract registered for action: ${action}`);
  }

  validateTransaction(transaction) {
    try {
      // Check if action is registered
      if (!this.registeredActions.has(transaction.action)) {
        console.log(`Unknown action: ${transaction.action}`);
        return false;
      }

      // Get the contract validator
      const validator = this.contracts.get(transaction.action);
      if (!validator) {
        console.log(`No validator found for action: ${transaction.action}`);
        return false;
      }

      // Execute the contract validation
      const isValid = validator(transaction);
      
      if (!isValid) {
        console.log(`Contract validation failed for action: ${transaction.action}`);
      }

      return isValid;
    } catch (error) {
      console.error('Contract validation error:', error);
      return false;
    }
  }

  // Order Management Contracts
  validateOrderCreated(transaction) {
    try {
      const { data } = transaction;
      
      // Required fields for order creation
      const requiredFields = ['order_id', 'supplier_id', 'total_amount', 'items'];
      for (const field of requiredFields) {
        if (!data[field]) {
          console.log(`Missing required field: ${field}`);
          return false;
        }
      }

      // Validate order ID format
      if (typeof data.order_id !== 'string' || data.order_id.length < 3) {
        console.log('Invalid order ID format');
        return false;
      }

      // Validate supplier ID
      if (typeof data.supplier_id !== 'number' || data.supplier_id <= 0) {
        console.log('Invalid supplier ID');
        return false;
      }

      // Validate total amount
      if (typeof data.total_amount !== 'number' || data.total_amount <= 0) {
        console.log('Invalid total amount');
        return false;
      }

      // Validate items array
      if (!Array.isArray(data.items) || data.items.length === 0) {
        console.log('Items must be a non-empty array');
        return false;
      }

      // Validate each item
      for (const item of data.items) {
        if (!item.product_id || !item.quantity || !item.unit_price) {
          console.log('Invalid item structure');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Order creation validation error:', error);
      return false;
    }
  }

  validateOrderApproved(transaction) {
    try {
      const { data } = transaction;
      
      // Required fields for order approval
      const requiredFields = ['order_id', 'approved_by', 'approval_date'];
      for (const field of requiredFields) {
        if (!data[field]) {
          console.log(`Missing required field: ${field}`);
          return false;
        }
      }

      // Validate order ID
      if (typeof data.order_id !== 'string') {
        console.log('Invalid order ID');
        return false;
      }

      // Validate approver
      if (typeof data.approved_by !== 'string' || data.approved_by.length < 2) {
        console.log('Invalid approver');
        return false;
      }

      // Validate approval date
      const approvalDate = new Date(data.approval_date);
      if (isNaN(approvalDate.getTime())) {
        console.log('Invalid approval date');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Order approval validation error:', error);
      return false;
    }
  }

  // Shipment Management Contracts
  validateShipmentCreated(transaction) {
    try {
      const { data } = transaction;
      
      // Required fields for shipment creation
      const requiredFields = ['shipment_id', 'order_id', 'carrier', 'tracking_number'];
      for (const field of requiredFields) {
        if (!data[field]) {
          console.log(`Missing required field: ${field}`);
          return false;
        }
      }

      // Validate shipment ID
      if (typeof data.shipment_id !== 'string') {
        console.log('Invalid shipment ID');
        return false;
      }

      // Validate order ID
      if (typeof data.order_id !== 'string') {
        console.log('Invalid order ID');
        return false;
      }

      // Validate carrier
      if (typeof data.carrier !== 'string' || data.carrier.length < 2) {
        console.log('Invalid carrier');
        return false;
      }

      // Validate tracking number
      if (typeof data.tracking_number !== 'string' || data.tracking_number.length < 5) {
        console.log('Invalid tracking number');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Shipment creation validation error:', error);
      return false;
    }
  }

  validateShipmentDelivered(transaction) {
    try {
      const { data } = transaction;
      
      // Required fields for shipment delivery
      const requiredFields = ['shipment_id', 'delivery_date', 'received_by'];
      for (const field of requiredFields) {
        if (!data[field]) {
          console.log(`Missing required field: ${field}`);
          return false;
        }
      }

      // Validate delivery date
      const deliveryDate = new Date(data.delivery_date);
      if (isNaN(deliveryDate.getTime())) {
        console.log('Invalid delivery date');
        return false;
      }

      // Validate received by
      if (typeof data.received_by !== 'string' || data.received_by.length < 2) {
        console.log('Invalid received by');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Shipment delivery validation error:', error);
      return false;
    }
  }

  // Payment Processing Contracts
  validatePaymentProcessed(transaction) {
    try {
      const { data } = transaction;
      
      // Required fields for payment processing
      const requiredFields = ['payment_id', 'order_id', 'amount', 'payment_method'];
      for (const field of requiredFields) {
        if (!data[field]) {
          console.log(`Missing required field: ${field}`);
          return false;
        }
      }

      // Validate payment ID
      if (typeof data.payment_id !== 'string') {
        console.log('Invalid payment ID');
        return false;
      }

      // Validate amount
      if (typeof data.amount !== 'number' || data.amount <= 0) {
        console.log('Invalid payment amount');
        return false;
      }

      // Validate payment method
      const validMethods = ['credit_card', 'bank_transfer', 'cash', 'check'];
      if (!validMethods.includes(data.payment_method)) {
        console.log('Invalid payment method');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Payment processing validation error:', error);
      return false;
    }
  }

  // Inventory Management Contracts
  validateInventoryAdjusted(transaction) {
    try {
      const { data } = transaction;
      
      // Required fields for inventory adjustment
      const requiredFields = ['product_id', 'adjustment', 'reason', 'adjusted_by'];
      for (const field of requiredFields) {
        if (!data[field]) {
          console.log(`Missing required field: ${field}`);
          return false;
        }
      }

      // Validate product ID
      if (typeof data.product_id !== 'number' || data.product_id <= 0) {
        console.log('Invalid product ID');
        return false;
      }

      // Validate adjustment (can be positive or negative)
      if (typeof data.adjustment !== 'number') {
        console.log('Invalid adjustment value');
        return false;
      }

      // Validate reason
      if (typeof data.reason !== 'string' || data.reason.length < 5) {
        console.log('Invalid reason');
        return false;
      }

      // Validate adjusted by
      if (typeof data.adjusted_by !== 'string' || data.adjusted_by.length < 2) {
        console.log('Invalid adjusted by');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Inventory adjustment validation error:', error);
      return false;
    }
  }

  // Supplier Management Contracts
  validateSupplierRegistered(transaction) {
    try {
      const { data } = transaction;
      
      // Required fields for supplier registration
      const requiredFields = ['supplier_id', 'name', 'address', 'contact_person'];
      for (const field of requiredFields) {
        if (!data[field]) {
          console.log(`Missing required field: ${field}`);
          return false;
        }
      }

      // Validate supplier ID
      if (typeof data.supplier_id !== 'number' || data.supplier_id <= 0) {
        console.log('Invalid supplier ID');
        return false;
      }

      // Validate name
      if (typeof data.name !== 'string' || data.name.length < 2) {
        console.log('Invalid supplier name');
        return false;
      }

      // Validate address
      if (typeof data.address !== 'string' || data.address.length < 10) {
        console.log('Invalid address');
        return false;
      }

      // Validate contact person
      if (typeof data.contact_person !== 'string' || data.contact_person.length < 2) {
        console.log('Invalid contact person');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Supplier registration validation error:', error);
      return false;
    }
  }

  // Mining Reward Contract
  validateMiningReward(transaction) {
    try {
      // Mining rewards should have no sender (null from address)
      if (transaction.from !== null) {
        console.log('Mining reward must have null sender');
        return false;
      }

      // Mining rewards must have a recipient
      if (!transaction.to) {
        console.log('Mining reward must have a recipient');
        return false;
      }

      // Mining rewards must have a positive amount
      if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
        console.log('Mining reward must have a positive amount');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Mining reward validation error:', error);
      return false;
    }
  }

  // Transfer Contract
  validateTransfer(transaction) {
    try {
      // Transfer must have sender and recipient
      if (!transaction.from || !transaction.to) {
        console.log('Transfer must have sender and recipient');
        return false;
      }

      // Sender and recipient must be different
      if (transaction.from === transaction.to) {
        console.log('Sender and recipient must be different');
        return false;
      }

      // Transfer must have a positive amount
      if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
        console.log('Transfer must have a positive amount');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Transfer validation error:', error);
      return false;
    }
  }

  // Utility method to get contract info
  getContractInfo() {
    return {
      registeredActions: Array.from(this.registeredActions),
      contractCount: this.contracts.size,
      availableContracts: Object.fromEntries(
        Array.from(this.contracts.entries()).map(([action, validator]) => [
          action,
          {
            validator: validator.name,
            description: this.getContractDescription(action)
          }
        ])
      )
    };
  }

  getContractDescription(action) {
    const descriptions = {
      'order_created': 'Validates order creation with required fields and data structure',
      'order_approved': 'Validates order approval with approver and date information',
      'shipment_created': 'Validates shipment creation with carrier and tracking details',
      'shipment_delivered': 'Validates shipment delivery confirmation',
      'payment_processed': 'Validates payment processing with method and amount',
      'inventory_adjusted': 'Validates inventory adjustments with reason and quantity',
      'supplier_registered': 'Validates supplier registration with contact information',
      'mining_reward': 'Validates mining reward transactions',
      'transfer': 'Validates basic transfer transactions'
    };
    
    return descriptions[action] || 'No description available';
  }

  // Method to add custom business rules
  addCustomRule(action, ruleName, ruleFunction) {
    if (!this.contracts.has(action)) {
      console.log(`Action ${action} not registered`);
      return false;
    }

    const validator = this.contracts.get(action);
    const originalValidator = validator;
    
    // Wrap the original validator with custom rule
    this.contracts.set(action, (transaction) => {
      const baseValidation = originalValidator(transaction);
      if (!baseValidation) return false;
      
      return ruleFunction(transaction);
    });
    
    console.log(`Custom rule ${ruleName} added to action ${action}`);
    return true;
  }
}
