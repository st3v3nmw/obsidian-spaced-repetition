#course/aws/developer-associate 

In this lesson, we're going to look at two different strategies for protecting the consistency of our data in DynamoDB. One's called optimistic locking and then we'll talk about conditional updates. 

# Optimistic Locking

So first [[Optimistic Locking|optimistic locking]]. This is a strategy to ensure that the client-side item you're updating or deleting is the same as the item in DynamoDB. And it protects the database writes from being overwritten by the writes of others or vice versa. 

So best to understand by using an example. So we have a DynamoDB table and we can see some of the items in that table. And here we have a SKU and a price. Now what's happening is application instance here on the left wants to update SKU 1 from 1,299 to 1,499. And that's successful. But then application instance two here then tries to update the SKU 1 to 1,399 and that's also successful. Now perhaps the application on the right hand side here was supposed to write that update before the subsequent update to 1499 but maybe there was some kind of delay in processing. 

So now we've got the wrong price in the table. Now, a way to resolve that is now what we do with optimistic locking is we specify update SKU 1 to 1,499 if the item version equals one. So it gets updated. Then the other application instance comes along, but it was also given instructions to update SKU 1 to 1399 if item version is one. 

And that fails because the item was already updated. So that's optimistic locking. 

![[Pasted image 20240507215621.png]]

# Conditional Updates

Next we have [[Conditional Write|conditional updates]]. To manipulate data in DynamoDB tables you use the put item, update item, and delete item API operations. You can optionally specify a condition expression to determine which items should be modified. And if the condition expression evaluates to true, the operation succeeds. Otherwise the operation will fail. So let's have a look at an example. 

This CLI command allows the right to proceed only if the item in question does not already have the same key. In another example, the CLI command uses attribute not exist to delete a product only if it does not have a price attribute. So in both cases we've got attribute not exists, here we've got ID, and here we've got price. 

![[Pasted image 20240507215928.png]]

In another example, the CLI command only deletes an item if the product category is either sporting goods or gardening supplies and the price is between 500 and 600. So we've got multiple conditions here, product category in cat one and cat two and price between the low and the high that we specify.

----

# Questions

What is "optimistic" about DynamoDB's optimistic locking
?
At the start of the read - modify - write process, the item is simply read and no resource wasted to lock the record from use by other applications
<!--SR:!2024-08-07,44,250-->