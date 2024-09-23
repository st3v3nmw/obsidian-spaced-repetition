#course/aws/developer-associate 

Hi guys. In this lesson, I'm going to cover [[Amazon DynamoDB Streams|DynamoDB streams]]. So what is streams? Well, let's have a look at an example. So we have an application here, a DynamoDB table and then DynamoDB streams. Our application is writing items to the table. Maybe it's inserting, updating, or deleting an item. So we can see that as the first operation here. 

A record is written to the DynamoDB stream. So after a change is made to the DynamoDB table, all changes are then projected into the DynamoDB stream. We might then have a lambda function being triggered and it will do something like process the information in the stream and write something to CloudWatch Logs. So just an example of using a stream. 

![[Pasted image 20240507224507.png]]

So streams captures a time-ordered sequence of item level modifications in a DynamoDB table. And the information is stored in a log for up to 24 hours. Applications can access that log and view the data items as they appeared before and after they were modified in near real time. You can also use the create table or update table API operations to enable or modify a stream. 

#### StreamSpecification

The stream specification parameter determines how the stream is configured. 

So stream enabled specifies that a stream is enabled if it's true or disabled if it's false. 

Stream view type specifies the information that will be written to the stream whenever data in the table is modified. So what we can do is we can decide what information we want to replicate into streams:
- Either keys only, that means only the key attributes of the modified item. 
- New image. So the entire item as it appears after it was modified 
- Old image. The entire item as it appeared before it was modified. Or 
- new and old images and that's both the new and old images of the item

So this is a great way to record the information that's changed in your table. Maybe you want to take the old items so you can archive it in some way. So you've got a record of the items before they were modified. Or maybe you want to take the new information and process that outside of DynamoDB by using a Lambda function or some other processing element to read from the stream.

----
# Questions

What is the maximum time that information is stored in a DynamoDB stream:: 24 hours
<!--SR:!2024-08-04,12,210-->

Is there any order to the items in a DynamoDB stream:: yes - they are a time ordered sequence
<!--SR:!2024-07-26,41,250-->

Are DynamoDB streams considered (1) real time (2) near real time (3) batch::Near real time
<!--SR:!2024-07-19,36,250-->

What options are there over the content of items in a DynamoDB stream:: (1) the keys only (2) only the old values of the item (3) only the new values (4) both old and new
<!--SR:!2024-09-05,63,250-->

