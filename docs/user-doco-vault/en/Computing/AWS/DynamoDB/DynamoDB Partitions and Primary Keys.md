#course/aws/dynamo-db

 Hi guys. In this lesson, we're going to cover DynamoDB Partitions and Primary Keys. And this stuff is really important to understand so you can design your table for throughput and also searchability. 
 
 DynamoDB stores data in partitions. And a partition is an allocation of storage for a table that's automatically replicated across multiple AZs within the region. DynamoDB manages the partitions fully for you. DynamoDB will always allocate sufficient partitions to support the provision throughput requirements. 
 
 So when you specify the throughput you need on the frontend, and we'll see how to do that in this section, then DynamoDB will automatically take care of spreading your data across the relevant partitions. DynamoDB allocates additional partitions to a table in various situations. So if you increase the table's provisioned throughput settings beyond what the existing partitions can support, or if an existing partition fills to capacity and more storage is actually required. 
 
 Now, for primary keys, there are two different types of primary key. We've got the partition keys and composite keys. 
 
 A partition key must be a unique attribute such as a user ID. So every user will have their own individual ID. The value of the partition key is input to an internal hash function and that determines the partition or physical location on which the data is stored. If you're using the partition key as your primary key, we'll see what all this means in a moment, then no two items can have the same partition key. 
 
 So let's look at an example table. On the left hand side here, we have a partition key. Now, in this case this is using a post ID, so maybe it's something like a forum. And there's a unique ID for each entry in the forum. And then on the right we have the attributes. And those are the information associated with each of these entries in the table. 


 You can also have something called a composite key. That is a partition key plus a {{sort key}} in combination. 


 So an example is a user posting to a forum. The partition key would be the user ID and the sort key would be the timestamp of the post. The two together mean that you can have multiple items in the table with the same partition key but they're going to have a different sort key and that creates uniqueness. Two items may have the same partition key but they must have a different sort key. 
 
 All items with the same partition key are stored together and then they're sorted according to the sort key value. So that's why I said it's important to understand how this works in terms of performance and searchability. Using a composite key allows you to store multiple items with the same partition key. If you don't have a composite key with a sort key then you can only ever have one item in the table for each partition key entry. So let's have a look at an example. We've got a partition key here which is the client ID. We've then got a sort key which is the created timestamp. And together they form the primary key or composite key as it has both a partition key and a sort key together. 
 
 So then we can have entries in the table such as this, where we have the email address of the user under the client ID and then some kind of timestamp in the created field. So we've got multiple items in the table. And we can of course in this situation with a composite key have multiple items from the same client ID, the same partition key. 
 
 Then we might have our various attributes. And in this case we've got a whole range of different attributes. Now notice that the data structure here can be unpredictable. So for some items there are no attributes assigned. And that's because this is a store. We've got the SKU, S-K-U and then we've got the category, size, color and weight. And some of those don't apply to some entries in the table. DynamoDB evenly distributes provisions throughput using what's called a read capacity unit and a write capacity unit. 
 
 So these are values you can specify. If your access pattern exceeds 3000 RCU or 1000 WCU for a single partition key value, your requests may be throttled. And reading or writing above the limit can be caused by a variety of issues including:
 - uneven distribution of data due to the wrong choice of partition key, 
 - frequent access of the same key in a partition, the most popular item which is sometimes known as a hot key, or 
 - a request rate greater than the provision throughput. 
 
 Let's go over some best practices for partition keys:
 - Use [[High Cardinality|high cardinality]] attributes, things like mail ID, employee number, customer ID, session ID, and so on. So these are things which should be completely unique. So that gives you high cardinality. 
 - Use composite attributes so your customer ID plus your products ID plus your country code giving even more uniqueness. And then you might have the order date as the sort key. 
 - Cache popular items using DynamoDB accelerator for caching reads. And that will offload some of the impacts on your database. 
 - Add random numbers or digits from a predetermined range for write heavy use cases. For example, you might add a random suffix to an invoice number such as this one. So we've got the invoice number and then in red we have some random value that we're going to add to it. That will help with spreading the rights across different partitions. 
 
 That's it for this lesson. I will see you in the next one. 
 
----

# Questions

What is needed to have DynamoDB partitions replicated across multiple AZs::Nothing - happens automatically
<!--SR:!2024-07-04,37,250-->

DynamoDB allocates additional partitions to a table in which 2 situations
?
(1) So if you increase the table's provisioned throughput settings beyond what the existing partitions can support, or
(2) if an existing partition fills to capacity and more storage is actually required.
<!--SR:!2024-07-07,3,190-->

What are the two different types of primary key::We've got the partition keys and composite keys.
<!--SR:!2024-07-25,44,250-->

In what situation must the partition key be unique within a table::If the primary key is configured as a partition key and not a composite key
<!--SR:!2024-08-26,34,250-->

The elements present in a composite key are::Partition key and sort key
<!--SR:!2024-09-22,88,270-->

How can you add an item into a DynamoDB table with the same partition key/sort key combination as an existing item::Can't be done - the combination must be unique
<!--SR:!2024-08-15,53,250-->

What configuration of a DynamoDB table is necessary so that items with the same partition key can be spread over multiple partitions
?
Can't be done - All items with the same partition key are stored together
<!--SR:!2024-07-31,47,250-->

What are the RCU and WCU limits for a single partition key value::3000 RCU, 1000 WCU <!--SR:!2024-08-01,7,190-->

What are 3 causes of reading or writing above the RCU/WCU limits
?
(1) uneven distribution of data due to the wrong choice of partition key,
(2) frequent access of the same key in a partition, the most popular item which is sometimes known as a hot key, or
(3) a request rate greater than the provision throughput.
<!--SR:!2024-06-28,14,210-->

What is the definition of high cardinality::A data field that contains many distinct values
<!--SR:!2024-07-28,44,250-->




































