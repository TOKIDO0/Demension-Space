package com.example.entity;

import lombok.Data;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import com.baomidou.mybatisplus.annotation.TableId;


@Data
@TableName("supplyinfo")
public class Supplyinfo extends Model<Supplyinfo> {
    /**
      * 主键
      */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
      * 地址 
      */
    private String address;

    /**
      * 联系人 
      */
    private String contact;

    /**
      * 供应商名称 
      */
    private String name;

    /**
      * 联系信息 
      */
    private String phone;

}