---
sr-due: 2024-08-01
sr-interval: 3
sr-ease: 269
---

#course/aws/developer-associate  #review

In this lesson, I'm going to cover what are called [[Local Secondary Index (LSI)|Local Secondary Indexes]] and [[Global Secondary Index (GSI)|Global Secondary Indexes]], LSIs and GSIs. 

# Local Secondary Indexes

So firstly let's look at the LSIs]]. These provide an alternative sort key to use for scans and queries. 

You can create up to five LSIs per table. And they must be created at the creation time for your DynamoDB table. You cannot add, remove, or modify them later on. 

The LSI has the same partition key as your original table, but it has a different sort key. So this helps you being able to perform scans and queries that you can't do in your primary table. Essentially it gives you a different view of your data organized by the alternative sort key. 

Any queries based on the sort key are much faster using the index than the main table. So let's have a look at the diagram. We have our primary table. And I'm not showing the attributes. I'm just showing the partition key and the sort key here. 

So we have client ID and then we have created. Now what we might want to do is create an index from our primary table. And this LSI has a partition key and the partition key is always going to be the same, so it's client ID. But in this case the sort key is the SKU. 

![[Pasted image 20240507170722.png]]

Attributes can be optionally [[Attribute Projection|projected]] and that means that they will be actually put into the LSI as well. So it really depends what exactly you're searching for. So remember the sort key is different on the LSI, but the partition key is always the same. 

Now let's have a look at a couple of examples of querying. So in this example, querying the main table we must use the partition key client ID and the sort key created. But in another example with an LSI, we can query the index for any orders made by a certain user with the SKU because we can have a different sort key than the main table. 

# GSI

Next we have the Global Secondary Index. This is used to speed up queries on non-key attributes. So those are not part of the partition key. You can create these when you create your table or at any time. And you can specify a different partition key as well as a different sort key. It gives a completely different view of the data. And it speeds up any queries relating to this alternative partition key and sort key. 

So again, let's have a look at an example. We have a primary table here with a partition key or client ID. And a sort key is created. The index is created again from the primary table. And with the GSI, in this case we've got a completely different partition key and a different sort key. And again optionally, we can project attributes into the GSI if we wish to. So let's look at an example. And in this one we can query the index for orders of the SKU where the quantity is greater than one. 

And that's because we have a different partition key and a different sort key.

----

# Questions

What are 3 limitations of DynamoDB LSIs
?
(1) must have the same partition key as the table itself
(2) a maximum of five LSIs per table
(3) the LSIs must be specified at the time that the table is created, can't be changed afterwards
<!--SR:!2024-09-06,73,250-->

What is DynamoDB attribute projection::Attributes that are actually stored within the LSI
<!--SR:!2024-09-15,62,230-->

Which is more flexible - DynamoDB LSIs or GSIs and give 2 reasons
?
GSIs are more flexible -
(1) they can be created at any time, not just when the table is created
(2) they can have a different partition key than the base table
<!--SR:!2024-08-20,56,250-->
