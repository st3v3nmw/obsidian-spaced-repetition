#course/aws/developer-associate 

Hi guys, in this lesson I'm going to cover DynamoDB capacity units, RCUs and WCUs. For the exam you need to know what these are and also how to calculate them. 

So there's a couple of [[DynamoDB Capacity Modes|modes]] that we can apply to our table. 

# Provisioned Capacity

The first is known as [[DynamoDB Provisioned|provision capacity]] and this is the default setting. In this case you specify the reads and writes per second. You can also enable Auto Scaling for dynamic adjustments. And the capacity is specified using both read capacity units and write capacity units. 

So in the example here we can see we've got read capacity and write capacity, we've got Auto Scaling on, and we've specified the minimum and the maximum and also a target utilization, so what is the utilization that we want to target? 

![[Pasted image 20240506143842.png]]

## RCUs

So let's look into some more detail of RCUs, read capacity units. 

- Each API called to read data from your table is a read request. 
- Read requests can be strongly consistent, eventually consistent, or transactional. 

Now think of these as credit. So an RCU is essentially a credit that gives you the ability to use some of the capacity of DynamoDB. Now for items up to 4 KB in size one RCU will equal:
- one strongly consistent read per second, 
- two eventually consistent reads per second or 
- 0.5 transactional read requests per second. 

For items that are larger than 4 KB, these will require additional RCUs. Now you do need to understand how to calculate RCUs for a given use case. So let's have a look. On the left, we have the requirements and on the right the RCUs needed. So based on the information on the previous slide, we know how to calculate. 

- So in this case we've got 10 strongly consistent reads per second of 4 KB each. So that's 10 * 4 KB / 4 KB = 10 RCUs. And we know this is correct because one RCU equals one strongly consistent read. 
- In the next example we require 10 strongly consistent reads per second of 11 KB each. Now we need to round 11 up to 12 because one RCU is up to 4 KB. So we've got 10 * 12 and then we're dividing it by 4 KB. So we need 30 RCUs. 
- In the next example we need 20 eventually consistent reads per second of 12 KB each. Now in this case the calculation is 20/2 * 12/4 and that also equals 30 RCUs. Remember that one RCU equals two eventually consistent reads per second. 
- In the next example we have 36 eventually consistent reads per second of 16 KB each. So in this case it's 36/2 * 16/4 and we need 72 RCU. 

![[Pasted image 20240506145524.png]]

Now there is a nice tool in the console where you can put in your requirements and it tells you the RCU or WCUs you need. So we'll look at that in the hands-on. 

## WCUs

Now let's move on to write capacity units. Each API call to write data is a write request. For items up to 1 KB in size one WCU can perform:
- one standard write requests per second or 
- 0.5 transactional write requests per second. 

Items larger than 1 KB require additional WCUs. So let's look at some examples. 

- In the first requirement we need 10 standard writes per second of 4 KB each. That's simply 10 * 4=40 WCUs. 
- 12 standard writes per second of 9.5 KB each gets rounded up to 10. So we've got 12 * 10 which is simply 120 WCUs. It's a bit easier with WCUs. 
- Next we have 12 transactional writes per second of four KB each. In this case it's 10 * 2 * 4= 80 WCU. And that's because one WCU equals 0.5 transactional write requests per second. 
- In the last example we have 12 transactional write requests per second of 9.5 KB so that will get rounded up to 10. That's 12 * 2 * 10=240 WCU. 

![[Pasted image 20240506150447.png]]
# On-demand Capacity

If we don't want to use provision capacity, we can also use on-demand capacity. With on-demand, you don't need to specify your requirements. DynamoDB instantly scales up and down based on the activity of your application. So this is really good for unpredictable or spiky workloads or new workloads where you don't really understand the resource requirements well. You pay for what you use and that's per request. And you can see here where you can specify whether you want to use on-demand or provisioned and you can change between these.

----

# Questions

What is the block size for DynamoDB RCU/WCU accounting:: 4KB/1KB
<!--SR:!2024-07-21,37,250-->

What are the DynamoDB read types (consistency models etc), and how many RCUs does it take to read 4KB item
?
(1) one strongly consistent read per second
(2) two eventually consistent reads per second or
(3) 0.5 transactional read requests per second. <!--SR:!2024-09-26,63,230-->

How many RCUs are needed for 10 strongly consistent reads per second of 11 KB each::Now we need to round 11 up to 12 because one RCU is up to 4 KB. So we've got 10 * 12 and then we're dividing it by 4 KB. So we need 30 RCUs.
<!--SR:!2024-08-07,45,230-->

What are the DynamoDB write types, and how many WCUs does it take to write 1KB item
?
(1) one standard write per second
(2) 0.5 transactional write requests per second.
<!--SR:!2024-08-04,47,250--> 

How many WCUs are needed for 12 transactional write requests per second of 9.5 KB::so that will get rounded up to 10. That's 12 * 2 * 10=240 WCU.
<!--SR:!2024-07-25,40,250-->





































































































































